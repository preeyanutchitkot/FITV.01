# app/routers/admin.py
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional
from app.utils.email_sender import send_reject_email
import os, jwt
from app import models
from urllib.parse import urljoin, quote

from app.db import get_db
from pydantic import BaseModel
from datetime import timedelta
import hashlib
import bcrypt

router = APIRouter(prefix="/admin", tags=["admin"])

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class RejectBody(BaseModel):
    reason: str | None = None

def get_current_admin(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, os.getenv("JWT_SECRET","your_jwt_secret"), algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    return payload

@router.post("/login")
def admin_login(login_data: AdminLoginRequest, db: Session = Depends(get_db)):
    """Admin login endpoint"""
    print(f"🔐 Admin login attempt - Username: {login_data.username}")
    
    # Find admin by username first
    admin = db.query(models.Admin).filter(
        models.Admin.username == login_data.username
    ).first()
    
    if not admin:
        raise HTTPException(
            status_code=401, 
            detail="Invalid admin credentials"
        )
    
    # Verify password using bcrypt
    print(f"🔑 Verifying password for admin: {admin.username}")
    password_matches = bcrypt.checkpw(login_data.password.encode('utf-8'), admin.password_hash.encode('utf-8'))
    print(f"✅ Password verification result: {password_matches}")
    
    if not password_matches:
        raise HTTPException(
            status_code=401, 
            detail="Invalid admin credentials"
        )
    
    # Create JWT token for admin
    payload = {
        "sub": str(admin.id),
        "username": admin.username,
        "role": "admin",
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    
    token = jwt.encode(
        payload, 
        os.getenv("JWT_SECRET", "your_jwt_secret"), 
        algorithm="HS256"
    )
    
    return {
        "message": "Admin login successful",
        "admin": {
            "id": admin.id,
            "username": admin.username,
            "role": "admin"
        },
        "token": token
    }

@router.post("/create-default-admin")
def create_default_admin(db: Session = Depends(get_db)):
    """Create default admin user (only if no admin exists)"""
    # Check if any admin already exists
    existing_admin = db.query(models.Admin).first()
    if existing_admin:
        raise HTTPException(
            status_code=400, 
            detail="Admin user already exists"
        )
    
    # Create default admin
    default_username = "admin"
    default_password = "admin123"  # Change this in production!
    
    # Hash password with bcrypt
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(default_password.encode('utf-8'), salt).decode('utf-8')
    
    new_admin = models.Admin(
        username=default_username,
        password_hash=password_hash
    )
    
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    
    return {
        "message": "Default admin created successfully",
        "username": default_username,
        "password": default_password,
        "note": "Please change the password after first login"
    }

@router.get("/test-admin-password")
def test_admin_password(db: Session = Depends(get_db)):
    """Test endpoint to check admin password (DEV ONLY)"""
    admin = db.query(models.Admin).filter(models.Admin.username == "admin").first()
    if not admin:
        return {"error": "Admin not found"}
    
    # Test common passwords
    test_passwords = ["admin123", "password", "admin", "123456"]
    results = {}
    
    for pwd in test_passwords:
        try:
            is_match = bcrypt.checkpw(pwd.encode('utf-8'), admin.password_hash.encode('utf-8'))
            results[pwd] = is_match
        except Exception as e:
            results[pwd] = f"Error: {str(e)}"
    
    return {
        "username": admin.username,
        "hash_preview": admin.password_hash[:20] + "...",
        "password_tests": results
    }

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == "trainer":
        db.query(models.TrainerTrainee).filter(
            models.TrainerTrainee.trainer_id == user.id
        ).delete(synchronize_session=False)
        db.query(models.Video).filter(
            models.Video.trainer_id == user.id
        ).delete(synchronize_session=False)
        # TODO: ถ้ามีตารางอื่นที่ FK trainer_id ให้เคลียร์เพิ่มที่นี่

    elif user.role == "trainee":
        db.query(models.TrainerTrainee).filter(
            models.TrainerTrainee.trainee_id == user.id
        ).delete(synchronize_session=False)
        # ถ้ามี WorkoutLog/Comment จริงค่อยปล่อยสองบรรทัดนี้
        # db.query(models.WorkoutLog).filter(models.WorkoutLog.trainee_id == user.id).delete(synchronize_session=False)
        # db.query(models.Comment).filter(models.Comment.user_id == user.id).delete(synchronize_session=False)

    db.query(models.Invite).filter(models.Invite.email == user.email).delete(synchronize_session=False)
    db.delete(user)
    db.commit()
    return

@router.get("/trainers/{trainer_id}/trainees")
def admin_list_trainer_trainees(
    trainer_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    trainer = db.query(models.User).filter(
        models.User.id == trainer_id, models.User.role == "trainer"
    ).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")

    links = db.query(models.TrainerTrainee).filter(
        models.TrainerTrainee.trainer_id == trainer_id
    ).all()
    trainee_ids = [l.trainee_id for l in links] or [0]

    trainees = db.query(models.User).filter(models.User.id.in_(trainee_ids)).all()
    return [
        {"id": t.id, "name": t.name, "email": t.email, "profile_image": t.profile_image}
        for t in trainees
    ]

@router.get("/trainees/{trainee_id}/trainer")
def admin_get_trainee_trainer(
    trainee_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    link = db.query(models.TrainerTrainee).filter(
        models.TrainerTrainee.trainee_id == trainee_id
    ).first()
    if not link:
        return {"trainer_id": None}
    return {"trainer_id": link.trainer_id}

@router.get("/videos/pending")
def list_pending_videos(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    rows = (
        db.query(
            models.Video,
            models.User.name.label("trainer_name"),
        )
        .outerjoin(models.User, models.User.id == models.Video.trainer_id)  # ใช้ outerjoin กันกรณีชื่อหาย
        .filter(
            models.Video.approved.is_(False),
            models.Video.rejected.is_(False),
            # ถ้ามีค่า NULL ใน approved/rejected ให้ใช้ coalesce แทนสองบรรทัดบน:
            # func.coalesce(models.Video.approved, False).is_(False),
            # func.coalesce(models.Video.rejected, False).is_(False),
        )
        .order_by(models.Video.created_at.desc())
        .all()
    )

    return [
        {
            "id": v.id,
            "title": v.title,
            "trainer_id": v.trainer_id,
            "trainer_name": tname,        # ได้จาก join
            "s3_url": v.s3_url,
            "difficulty": v.difficulty,
            "description": v.description,
            "kcal": getattr(v, "kcal", None),
            "duration": getattr(v, "duration", None),
            "created_at": v.created_at,
        }
        for (v, tname) in rows
    ]

@router.post("/videos/{video_id}/approve")
def approve_video(
    video_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    v = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Video not found")
    v.approved = True
    v.approved_at = datetime.utcnow()
    v.rejected = False
    v.reject_reason = None
    v.rejected_at = None
    db.add(v); db.commit(); db.refresh(v)
    return {"detail": "approved", "video_id": v.id, "approved_at": v.approved_at}

@router.post("/videos/{video_id}/reject")
def reject_video(
    video_id: int,
    body: RejectBody,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    v = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Video not found")

    # update status
    v.approved = False
    v.rejected = True
    v.reject_reason = (body.reason or "").strip()
    v.rejected_at = datetime.utcnow()
    db.add(v); db.commit(); db.refresh(v)

    # send email to trainer (background)
    trainer = db.query(models.User).filter(models.User.id == v.trainer_id).first()
    if trainer and trainer.email:
        FE_BASE = (os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/") + "/")

        # ✅ ไปหน้าแรกเลย
        landing_url = FE_BASE  # เช่น http://localhost:3000/

        background.add_task(
            send_reject_email,
            trainer.email,
            v.title or "",
            v.reject_reason or "",
            landing_url,  # พารามิเตอร์ตัวสุดท้ายของฟังก์ชันอีเมล
        )

    return {"detail": "rejected", "video_id": v.id}