from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User, TrainerTrainee, Video
from app.schemas import TraineeListItem, TraineeProfile
import jwt, os

router = APIRouter()

@router.get("/trainees", response_model=list[TraineeListItem])
def get_all_trainees(db: Session = Depends(get_db)):
    trainees = db.query(User).filter(User.role == "trainee").all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "email": t.email,
            "profile_image": t.profile_image,
        }
        for t in trainees
    ]




@router.get("/trainees/{trainee_id}", response_model=TraineeProfile)
def get_trainee_profile(trainee_id: int, db: Session = Depends(get_db)):
    trainee = db.query(User).filter(User.id == trainee_id, User.status == "trainee").first()
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee not foud")
    return trainee

 


@router.get("/my-trainer")
def get_my_trainer(request: Request, db: Session = Depends(get_db)):
    # auth จาก JWT
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth.split(" ")[1]
    JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        trainee_id = payload.get("user_id")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    # หา trainer ที่ผูกอยู่กับ trainee นี้
    link = (
        db.query(TrainerTrainee)
        .filter(TrainerTrainee.trainee_id == trainee_id)
        .first()
    )
    if not link:
        # ยังไม่ถูกผูกกับ trainer
        return {"id": None, "name": "", "picture": "", "members": 0, "videos": 0}

    trainer = db.query(User).filter(User.id == link.trainer_id).first()
    if not trainer:
        return {"id": None, "name": "", "picture": "", "members": 0, "videos": 0}

    # นับสมาชิกทั้งหมดของเทรนเนอร์คนนี้
    members_count = (
        db.query(TrainerTrainee)
        .filter(TrainerTrainee.trainer_id == trainer.id)
        .count()
    )

    # นับวิดีโอที่อนุมัติแล้วของเทรนเนอร์คนนี้
    videos_count = (
        db.query(Video)
        .filter(Video.trainer_id == trainer.id, Video.approved == True)
        .count()
    )

    return {
        "id": trainer.id,
        "name": trainer.name,
        "profile_image": getattr(trainer, "profile_image", None),
        "members": members_count,
        "videos": videos_count,
    }