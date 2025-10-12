from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db import get_db
from app.models import User, TrainerTrainee
from app.schemas import InviteRequest
from app.utils.email_sender import send_invitation_email
import os                                                       # + os
import jwt                                                      # + jwt



router = APIRouter()
JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")  
# ========== HELPERS ==========

def commit_or_500(db: Session):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")

def get_trainer_id_from_request(request: Request) -> int:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return int(payload.get("user_id"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def ensure_mapping(db: Session, trainer_id: int, trainee_id: int):
    exists = db.query(TrainerTrainee).filter(
        TrainerTrainee.trainer_id == trainer_id,
        TrainerTrainee.trainee_id == trainee_id
    ).first()
    if not exists:
        db.add(TrainerTrainee(trainer_id=trainer_id, trainee_id=trainee_id))
        commit_or_500(db)






# ========== INVITE TRAINER ==========

@router.post("/invite-trainer")
def invite_trainer(invite: InviteRequest, db: Session = Depends(get_db)):
    """
    เชิญเป็น Trainer:
    - ถ้ายังไม่มี user -> สร้าง invited_trainer/pending_trainer แล้วส่งเมล
    - ถ้ามี user:
        * ถ้าเป็น trainer อยู่แล้ว -> 400
        * ถ้า invited_trainer/pending_trainer -> ส่งเมลเชิญซ้ำ (re-invite)
        * เคสอื่นๆ (เช่น uninvited/trainee) -> อัปเกรดเป็น invited_trainer/pending_trainer แล้วส่งเมล
    """
    user = db.query(User).filter(User.email == invite.email).first()

    if user:
        role = (user.role or "").lower()
        status = (user.status or "").lower()

        # เป็นเทรนเนอร์เต็มสิทธิ์อยู่แล้ว
        if role == "trainer" or status == "trainer":
            raise HTTPException(status_code=400, detail="User is already a trainer")

        # อยู่ในสถานะรอรับเชิญ -> อนุญาต re-invite
        if role == "invited_trainer" or status == "pending_trainer":
            send_invitation_email(invite.email, role="trainer")
            return {"message": "Invitation resent to pending trainer"}

        # อัปเกรดจากสถานะอื่น (รวม uninvited/trainee) -> เข้าสู่ flow เชิญ
        user.role = "invited_trainer"
        user.status = "pending_trainer"
        commit_or_500(db)
        send_invitation_email(invite.email, role="trainer")
        return {"message": "Upgraded existing user to invited_trainer and sent invitation"}

    # ยังไม่มี -> สร้างคำเชิญใหม่
    new_user = User(
        email=invite.email,
        role="invited_trainer",
        status="pending_trainer",
    )
    db.add(new_user)
    commit_or_500(db)
    send_invitation_email(invite.email, role="trainer")
    return {"message": "Trainer invitation sent"}


# ========== INVITE TRAINEE ==========

@router.post("/invite")
def invite_trainee(invite: InviteRequest, request: Request, db: Session = Depends(get_db)):
    """
    เชิญเป็น Trainee:
    - ไม่ใช้ตาราง invites แล้ว
    - บันทึกความสัมพันธ์ trainer ↔ trainee ลง trainer_trainee ทันที
    """
    trainer_id = get_trainer_id_from_request(request)

    user = db.query(User).filter(User.email == invite.email).first()

    if user:
        role = (user.role or "").lower()
        status = (user.status or "").lower()

        # ถ้าเป็น trainee เต็มสิทธิ์อยู่แล้ว -> สร้าง mapping ให้ trainer นี้ (ถ้ายังไม่มี)
        if role == "trainee" or status == "trainee":
            ensure_mapping(db, trainer_id, user.id)
            raise HTTPException(status_code=400, detail="User is already a trainee")

        # อัปเกรดเข้าสู่ flow เชิญ (สถานะ pending)
        user.role = "invited_trainee"
        user.status = "pending"
        commit_or_500(db)

        # ผูกความสัมพันธ์ล่วงหน้า
        ensure_mapping(db, trainer_id, user.id)

        # ส่งอีเมลตามเดิม
        send_invitation_email(invite.email, role="trainee")
        return {"message": "Upgraded user to invited_trainee, mapped to trainer, and sent invitation"}

    # ยังไม่มี user -> สร้าง user pending และ mapping เลย
    new_user = User(email=invite.email, role="invited_trainee", status="pending")
    db.add(new_user)
    commit_or_500(db)

    ensure_mapping(db, trainer_id, new_user.id)

    send_invitation_email(invite.email, role="trainee")
    return {"message": "Trainee invitation created, mapped to trainer, and email sent"}

# ========== ACCEPT INVITE (ทั้ง trainer/trainee) ==========

@router.post("/accept-invite")
def accept_invite(email: str, db: Session = Depends(get_db)):
    """
    ผู้ถูกเชิญกดรับสิทธิ์:
    - invited_trainer / pending_trainer -> trainer/trainer
    - invited_trainee / pending        -> trainee/trainee
    - ไม่พบ user -> สร้าง uninvited/uninvited แล้ว 403
    - นอกเหนือ flow เชิญ -> 403
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        new_user = User(email=email, role="uninvited", status="uninvited")
        db.add(new_user)
        commit_or_500(db)
        raise HTTPException(status_code=403, detail="uninvited")

    role = (user.role or "").lower()
    status = (user.status or "").lower()

    if role == "invited_trainer" or status == "pending_trainer":
        user.role = "trainer"
        user.status = "trainer"
    elif role == "invited_trainee" or status == "pending":
        user.role = "trainee"
        user.status = "trainee"
    else:
        raise HTTPException(status_code=403, detail="uninvited")

    commit_or_500(db)
    return {"message": "Invitation accepted", "role": user.role, "status": user.status}
