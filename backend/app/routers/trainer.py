import subprocess
import json
import tempfile

from fastapi import APIRouter, Depends, Request, HTTPException, status, Response, File, UploadFile, Form
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Admin, User, TrainerTrainee, Video, VideoSegment, Exercise
from app.schemas import TraineeListItem, TraineeProfile
from app.schemas_video import VideoOut, VideoCreate, VideoUpdate
import jwt
import boto3
import os
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi.responses import StreamingResponse, FileResponse, RedirectResponse
import requests
from pathlib import Path
from sqlalchemy import text

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()



# GET /my-videos: ดึงวิดีโอของ trainer ที่ login อยู่


# POST /videos: อัพโหลดวิดีโอใหม่ (trainer เท่านั้น)
@router.post("/videos", response_model=VideoOut)
async def upload_video(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(...),
    difficulty: str = Form(None),
    description: str = Form(None),
    db: Session = Depends(get_db)
):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split(" ")[1]
    JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        trainer_id = payload.get("user_id")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Upload file to S3
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")
    AWS_REGION = os.getenv("AWS_REGION").strip()
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    # Read file bytes once for both S3 upload and ffprobe
    file_bytes = await file.read()
    s3_key = f"videos/{file.filename}"
    from io import BytesIO
    try:
        s3_client.upload_fileobj(BytesIO(file_bytes), AWS_S3_BUCKET, s3_key, ExtraArgs={"ContentType": file.content_type})
        s3_url = f"https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"S3 upload error: {str(e)}")

    # Extract duration (seconds) from uploaded file using ffprobe
    duration_seconds = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[-1]) as temp_file:
            temp_file.write(file_bytes)
            temp_path = temp_file.name
        def probe_duration(file_path: str) -> float:
            cmd = [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "json", file_path
            ]
            out = subprocess.check_output(cmd)
            info = json.loads(out)
            return float(info["format"]["duration"])
        duration_seconds = int(probe_duration(temp_path))
        print(f"[DEBUG] duration_seconds from ffprobe: {duration_seconds}")
        os.remove(temp_path)
    except Exception as e:
        print(f"[DEBUG] ffprobe error: {e}")
        duration_seconds = None  # fallback if error

    # สร้าง Video record
    video = Video(
        title=title,
        trainer_id=trainer_id,
        difficulty=difficulty,
        description=description,
        s3_url=s3_url,
        created_at=datetime.utcnow(),
        approved=False,
        duration=duration_seconds
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    return video



@router.get("/trainers", response_model=list[TraineeListItem])
def get_all_trainers(db: Session = Depends(get_db)):
    trainers = db.query(User).filter(User.role == "trainer").all()
    return [{"id": t.id, "name": t.name, "email": t.email} for t in trainers]



@router.get("/trainers/{trainer_id}", response_model=TraineeProfile)
def get_trainer_profile(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(User).filter(User.id == trainer_id, User.role == "trainer").first()
    if not trainer:
        return {"detail": "Trainer not found"}
    # Return TrainerProfile with is_online and last_active
    return {
        "id": trainer.id,
        "name": trainer.name,
        "email": trainer.email,
        "points": trainer.points,
        "streak": trainer.streak,
        "profile_image": trainer.profile_image,
        "is_online": trainer.is_online,
        "last_active": trainer.last_active
    }



# Endpoint: GET /my-trainees (trainer ดูรายชื่อลูกเทรนตัวเอง)
@router.get("/my-trainees", response_model=list[TraineeListItem])
def get_my_trainees(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split(" ")[1]
    JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        trainer_id = payload.get("user_id")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    # ดึง trainee_id ทั้งหมดที่ trainer_id นี้เชิญ
    trainee_ids = db.query(TrainerTrainee.trainee_id).filter(TrainerTrainee.trainer_id == trainer_id).all()
    trainee_ids = [tid[0] for tid in trainee_ids]
    trainees = db.query(User).filter(User.id.in_(trainee_ids)).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "email": t.email,
            "profile_image": t.profile_image,
            "is_online": t.is_online,
        }
        for t in trainees
    ]


# GET /my-videos: ดึงวิดีโอทั้งหมดของ trainer ที่ล็อกอิน

@router.get("/my-videos", response_model=List[VideoOut])
def get_my_videos(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split(" ")[1]
    JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        trainer_id = payload.get("user_id")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    videos = db.query(Video).filter(Video.trainer_id == trainer_id).order_by(Video.created_at.desc()).all()
    
    # เพิ่มข้อมูลที่จำเป็นสำหรับ frontend
    video_responses = []
    for video in videos:
        video_dict = {
            "id": video.id,
            "title": video.title,
            "trainer_id": video.trainer_id,
            "difficulty": video.difficulty,
            "description": video.description,
            "s3_url": video.s3_url,
            "approved": video.approved,
            "approved_at": video.approved_at,
            "rejected": video.rejected,
            "reject_reason": video.reject_reason,
            "rejected_at": video.rejected_at,
                        "duration": video.duration,  # duration จากไฟล์จริง (หน่วยเป็นวินาที)
            "created_at": video.created_at,
            # เพิ่มข้อมูลสำหรับ frontend  
            "image": video.s3_url,  # ใช้ video URL สำหรับ video element
            "kcal": 600,  # default kcal
            # เพิ่ม URL สำหรับ video preview
            "video_url": video.s3_url,
            "status": "Verifying" if not video.approved and not video.rejected else ("Active" if video.approved else "Rejected")
        }
        video_responses.append(video_dict)
    
    return video_responses


# GET /videos/{video_id}: ดึงข้อมูลวิดีโอแต่ละอัน
@router.get("/videos/{video_id}")
def get_video_by_id(video_id: int, request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = auth_header.split(" ")[1]
    JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # ดึงข้อมูลวิดีโอ
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # ตรวจสอบว่าเป็นวิดีโอของ trainer คนนี้หรือไม่ (หรือ trainee ที่มีสิทธิ์ดู)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # ถ้าเป็น trainer ต้องเป็นเจ้าของวิดีโอ
    if user.status == "trainer" and video.trainer_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # ถ้าเป็น trainee ต้องเป็นลูกศิษย์ของ trainer ที่เป็นเจ้าของวิดีโอ
    if user.status == "trainee":
        trainer_trainee = db.query(TrainerTrainee).filter(
            TrainerTrainee.trainer_id == video.trainer_id,
            TrainerTrainee.trainee_id == user_id
        ).first()
        if not trainer_trainee:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # สร้าง response
    video_dict = {
        "id": video.id,
        "title": video.title,
        "trainer_id": video.trainer_id,
        "difficulty": video.difficulty,
        "description": video.description,
        "s3_url": video.s3_url,
        "approved": video.approved,
        "approved_at": video.approved_at,
        "rejected": video.rejected,
        "reject_reason": video.reject_reason,
        "rejected_at": video.rejected_at,
        "duration": video.duration,
        "created_at": video.created_at,
        "image": video.s3_url,
        "kcal": 600,  # default kcal
        "video_url": video.s3_url,
        "status": "Verifying" if not video.approved and not video.rejected else ("Active" if video.approved else "Rejected")
    }
    
    return video_dict


# GET /my-trainees: ดึงรายชื่อลูกศิษย์ของเทรนเนอร์
@router.get("/my-trainees", response_model=List[dict])
def get_my_trainees(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split(" ")[1]
    JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        trainer_id = payload.get("user_id")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    trainees = (
        db.query(User)
        .join(TrainerTrainee, TrainerTrainee.trainee_id == User.id)
        .filter(TrainerTrainee.trainer_id == trainer_id)
        .all()
    )
    
    # แปลงเป็น dict เพื่อให้แน่ใจว่าส่ง profile_image ไปด้วย
    return [
        {
            "id": t.id,
            "name": t.name,
            "email": t.email,
            "profile_image": t.profile_image,
            "is_online": getattr(t, 'is_online', False),
            "last_active": getattr(t, 'last_active', None),
            "role": t.role,
            "status": t.status,
            "points": getattr(t, 'points', 0),
            "streak": getattr(t, 'streak', 0)
        }
        for t in trainees
    ]


# GET /trainers: ดึงรายชื่อ trainer ทั้งหมด
@router.get("/trainers")
def get_trainers(db: Session = Depends(get_db)):
    """Get all trainers for selection/display purposes"""
    trainers = db.query(User).filter(User.role == "trainer").all()
    return [{"id": trainer.id, "name": trainer.name, "email": trainer.email} for trainer in trainers]


# GET /trainers/{trainer_id}: ดึงข้อมูล trainer คนเดียว
@router.get("/trainers/{trainer_id}")
def get_trainer_by_id(trainer_id: int, db: Session = Depends(get_db)):
    """Get specific trainer information"""
    trainer = db.query(User).filter(User.id == trainer_id, User.role == "trainer").first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    return {
        "id": trainer.id,
        "name": trainer.name,
        "email": trainer.email,
        "profile_image": f"/profile-image/{trainer.id}",
        "created_at": trainer.created_at,
        "is_online": getattr(trainer, 'is_online', False),
        "last_active": getattr(trainer, 'last_active', None)
    }


# GET /profile-image/{user_id}: ส่งรูปโปรไฟล์ หรือ default image
@router.get("/profile-image/{user_id}")
def get_profile_image(user_id: int, db: Session = Depends(get_db)):
    """Get user profile image or return default"""
    from fastapi.responses import RedirectResponse
    import os
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # If user has profile_image URL in database, redirect to it
    if user.profile_image and user.profile_image.strip():
        return RedirectResponse(url=user.profile_image)
    
    # Otherwise, redirect to generated avatar
    avatar_url = f"https://ui-avatars.com/api/?name={user.name.replace(' ', '+')}&background=random&color=fff&size=128"
    return RedirectResponse(url=avatar_url)


# DELETE /videos/{video_id}: ลบวิดีโอ
@router.delete("/videos/{video_id}")
def delete_video(video_id: int, request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        print("[DELETE VIDEO] No or invalid Authorization header")
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split(" ")[1]
    JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        trainer_id = payload.get("user_id")
    except Exception as e:
        print(f"[DELETE VIDEO] JWT decode error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

    print(f"[DELETE VIDEO] video_id={video_id}, trainer_id={trainer_id}")
    video = db.query(Video).filter(Video.id == video_id, Video.trainer_id == trainer_id).first()
    print(f"[DELETE VIDEO] video found: {video is not None}")
    if video:
        print(f"[DELETE VIDEO] video.trainer_id={video.trainer_id}")
    if not video:
        print("[DELETE VIDEO] Video not found, returning 404")
        raise HTTPException(status_code=404, detail="Video not found")

    # Remove video file if exists
    if video.s3_url and video.s3_url.startswith("/static/"):
        filename = video.s3_url.replace("/static/", "")
        file_path = os.path.join("uploaded_videos", filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"[DELETE VIDEO] Error removing file: {e}")
                pass

    # Step 1: Find all related segments
    segments = db.query(VideoSegment).filter(VideoSegment.video_id == video_id).all()
    print(f"[DELETE VIDEO] Found {len(segments)} segments to delete")

    # Step 2: Delete all segments using raw SQL (to avoid foreign key constraint)
    if segments:
        segment_ids = [str(segment.id) for segment in segments]
        sql = f"DELETE FROM video_segments WHERE id IN ({','.join(segment_ids)})"
        db.execute(text(sql))
        print(f"[DELETE VIDEO] Deleted {len(segments)} segments from database")

    # Step 4: Finally delete the video
    db.delete(video)
    
    # Step 5: Commit all changes in one transaction
    db.commit()
    print(f"[DELETE VIDEO] Successfully deleted video {video_id} and all related data")
    return {"detail": "Video deleted"}


# GET /trainers/{trainer_id}/videos: ดึงวิดีโอที่ approved ของ trainer
@router.get("/trainers/{trainer_id}/videos", response_model=List[VideoOut])
def get_trainer_videos(trainer_id: int, db: Session = Depends(get_db)):
    videos = db.query(Video).filter(Video.trainer_id == trainer_id, Video.approved == True).order_by(Video.created_at.desc()).all()
    return videos


@router.delete("/my-trainees/{trainee_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_my_trainee(trainee_id: int, request: Request, db: Session = Depends(get_db)):
    # auth เหมือน /my-trainees
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split(" ")[1]
    JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        trainer_id = payload.get("user_id")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    # ยืนยันว่าเป็น trainer
    trainer = db.query(User).filter(User.id == trainer_id, User.role == "trainer").first()
    if not trainer:
        raise HTTPException(status_code=403, detail="Access denied")

    # หา link
    link = db.query(TrainerTrainee).filter(
        TrainerTrainee.trainer_id == trainer_id,
        TrainerTrainee.trainee_id == trainee_id
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Trainee not found")

    # ลบ
    db.delete(link)
    db.commit()
    return  # 204 No Content


# GET /exercises: ดึงรายการแบบฝึกหัดทั้งหมด
@router.get("/exercises")
def get_exercises(db: Session = Depends(get_db)):
    exercises = db.query(Exercise).all()
    return exercises


# POST /videos: สร้างวิดีโอใหม่ (multipart/form-data)
@router.post("/videos", response_model=VideoOut)
async def create_video(
    title: str = Form(...),
    difficulty: int = Form(...),
    description: str = Form(...),
    approved: bool = Form(False),
    segments: str = Form(...),
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db)
):
    # Authentication
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split(" ")[1]
    JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        trainer_id = payload.get("user_id")
    except Exception as e:
        print(f"[CREATE VIDEO] JWT decode error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        # Parse segments JSON
        segments_data = json.loads(segments)
        print(f"[CREATE VIDEO] Parsed segments: {segments_data}")
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith("video/"):
            raise HTTPException(status_code=400, detail="File must be a video")

        # Create uploads directory if it doesn't exist
        upload_dir = Path("uploaded_videos")
        upload_dir.mkdir(exist_ok=True)

        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = Path(file.filename).suffix
        safe_filename = f"{timestamp}_{file.filename.replace(' ', '_')}"
        file_path = upload_dir / safe_filename

        # Read file bytes once for both file save and ffprobe
        file_bytes = await file.read()
        
        # Save video file
        with open(file_path, "wb") as buffer:
            buffer.write(file_bytes)

        print(f"[CREATE VIDEO] Saved video file: {file_path}")

        # Extract duration (seconds) from uploaded file using ffprobe (จากโค้ดเก่า)
        duration_seconds = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
                temp_file.write(file_bytes)
                temp_path = temp_file.name
            
            def probe_duration(file_path: str) -> float:
                cmd = [
                    "ffprobe", "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "json", file_path
                ]
                out = subprocess.check_output(cmd)
                info = json.loads(out)
                return float(info["format"]["duration"])
            
            duration_seconds = int(probe_duration(temp_path))
            print(f"[CREATE VIDEO] duration_seconds from ffprobe: {duration_seconds}")
            os.remove(temp_path)
        except Exception as e:
            print(f"[CREATE VIDEO] ffprobe error: {e}")
            duration_seconds = None  # fallback if error
        
        # Create video record
        db_video = Video(
            title=title,
            trainer_id=trainer_id,
            difficulty=difficulty,
            description=description,
            approved=approved,
            s3_url=f"/static/{safe_filename}",
            duration=duration_seconds,  # เพิ่ม duration จากไฟล์จริง
            created_at=datetime.utcnow()
        )
        db.add(db_video)
        db.flush()  # Get the video ID
        
        # Create video segments
        for segment_data in segments_data:
            exercise_id = segment_data.get("exercise_id")
            start_time = segment_data.get("start_time")
            end_time = segment_data.get("end_time")
            
            if not all([exercise_id, start_time is not None, end_time is not None]):
                continue
                
            db_segment = VideoSegment(
                video_id=db_video.id,
                exercise_id=int(exercise_id),
                start_time=float(start_time),
                end_time=float(end_time)
            )
            db.add(db_segment)

        db.commit()
        db.refresh(db_video)
        
        print(f"[CREATE VIDEO] Successfully created video ID: {db_video.id}")
        return db_video

    except json.JSONDecodeError as e:
        print(f"[CREATE VIDEO] JSON decode error: {e}")
        raise HTTPException(status_code=400, detail="Invalid segments JSON format")
    except Exception as e:
        print(f"[CREATE VIDEO] Unexpected error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")


# PUT /videos/{video_id}/update-duration: อัปเดต duration จากไฟล์จริง
@router.put("/videos/{video_id}/update-duration")
def update_video_duration_endpoint(video_id: int, request: Request, db: Session = Depends(get_db)):
    """อัปเดต duration ของวิดีโอจากไฟล์จริง"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split(" ")[1]
    JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        trainer_id = payload.get("user_id")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    from app.utils.video_utils import update_video_duration
    success = update_video_duration(video_id, db)
    
    if success:
        return {"detail": "Duration updated successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to update duration")


# POST /videos/simple: สร้างวิดีโอใหม่ (JSON body - for testing)
@router.post("/videos/simple", response_model=VideoOut)
def create_video_simple(video: VideoCreate, request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split(" ")[1]
    JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        trainer_id = payload.get("user_id")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    # สร้างวิดีโอใหม่
    db_video = Video(
        title=video.title,
        trainer_id=trainer_id,
        difficulty=video.difficulty,
        description=video.description,
        approved=False  # ต้องรอการอนุมัติ
    )
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    return db_video
