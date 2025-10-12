from fastapi import APIRouter, Request, Depends, HTTPException, Body
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db import get_db
from app.models import User

import os
from authlib.integrations.starlette_client import OAuth
import jwt
from datetime import datetime, timedelta
import requests

from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

# ===== Google OAuth config =====
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    raise ValueError("Missing Google OAuth credentials")

oauth = OAuth()
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

def _issue_jwt(user: User) -> str:
    payload = {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(hours=24),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def _promote_if_invited(user: User, db: Session) -> None:
    """
    Promote อัตโนมัติเมื่อผู้ใช้ที่ล็อกอินเข้ามาเป็นสถานะ invited/pending
    - invited_trainer | pending_trainer -> trainer/trainer
    - invited_trainee | pending         -> trainee/trainee
    """
    role = (user.role or "").lower()
    status = (user.status or "").lower()

    if role == "invited_trainer" or status == "pending_trainer":
        user.role = "trainer"
        user.status = "trainer"
        db.commit()
        db.refresh(user)
        return

    if role == "invited_trainee" or status == "pending":
        user.role = "trainee"
        user.status = "trainee"
        db.commit()
        db.refresh(user)
        return

# ===== 1) เริ่ม OAuth flow =====
@router.get("/auth/google/start")
async def auth_google_start(request: Request):
    redirect_uri = f"{BACKEND_URL}/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

# ===== 2) OAuth callback =====
@router.get("/auth/google/callback")
async def auth_google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        # ดึง token + profile จาก Google
        token = await oauth.google.authorize_access_token(request)
        user_info = await oauth.google.parse_id_token(request, token)

        email = user_info.get("email")
        name = user_info.get("name")
        google_uid = user_info.get("sub")
        picture = user_info.get("picture", None)  # << เพิ่มบรรทัดนี้
        if not google_uid or not email:
            raise HTTPException(status_code=400, detail="Missing Google UID or Email")

        # หา user ด้วย email OR google_uid (กัน INSERT ซ้ำเมื่อถูกเชิญด้วยอีเมล)
        user = (
            db.query(User)
            .filter(or_(User.email == email, User.google_uid == google_uid))
            .one_or_none()
        )

        if user:
            # ผูก google_uid + เติมชื่อถ้ายังว่าง (ไม่ทับ role/status เดิม)
            user.google_uid = google_uid
            if name and not (user.name or "").strip():
                user.name = name
            if picture:
                user.profile_image = picture  # << อัปเดตรูปโปรไฟล์
            db.commit()
            db.refresh(user)
        else:
            # ไม่เจอ -> สร้างเป็น uninvited ตามเดิม
            user = User(
                email=email,
                name=name,
                google_uid=google_uid,
                role="uninvited",
                status="uninvited",
                profile_image=picture,  # << บันทึกรูปโปรไฟล์
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Promote อัตโนมัติถ้าเป็น invited/pending
        _promote_if_invited(user, db)

        # ถ้ายัง uninvited อยู่ ให้บล็อกตามเดิม
        if (user.role or "").lower() == "uninvited":
            raise HTTPException(status_code=403, detail="uninvited")

        jwt_token = _issue_jwt(user)
        return RedirectResponse(url=f"{FRONTEND_URL}/auth/google/callback?token={jwt_token}")

    except Exception as e:
        print("[Google OAuth Error]", e)
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_oauth&msg={str(e)}")

# ===== 3) Google One Tap (POST /auth/google) =====
@router.post("/auth/google")
async def google_one_tap_login(data: dict = Body(...), db: Session = Depends(get_db)):
    """
    Accepts Google One Tap credential, verifies it, and returns JWT/user info.
    Expects: { "token": "<google_credential>" }
    """
    token = data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing Google credential token")

    # Verify token with Google
    google_api_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
    resp = requests.get(google_api_url)
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    user_info = resp.json()

    # Check audience
    if user_info.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Invalid audience for Google token")

    email = user_info.get("email")
    name = user_info.get("name", "")
    google_uid = user_info.get("sub")
    picture = user_info.get("picture", None)  # << เพิ่มบรรทัดนี้
    if not google_uid or not email:
        raise HTTPException(status_code=400, detail="Missing Google UID or Email")

    # หา user ด้วย email OR google_uid
    user = (
        db.query(User)
        .filter(or_(User.email == email, User.google_uid == google_uid))
        .one_or_none()
    )

    if user:
        user.google_uid = google_uid
        if name and not (user.name or "").strip():
            user.name = name
        if picture:
            user.profile_image = picture  # << อัปเดตรูปโปรไฟล์
        db.commit()
        db.refresh(user)
    else:
        user = User(
            email=email,
            name=name,
            google_uid=google_uid,
            role="uninvited",
            status="uninvited",
            profile_image=picture,  # << บันทึกรูปโปรไฟล์
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Promote อัตโนมัติถ้าเป็น invited/pending
    _promote_if_invited(user, db)

    # Block ถ้ายัง uninvited
    if (user.role or "").lower() == "uninvited":
        raise HTTPException(status_code=403, detail="uninvited")

    jwt_token = _issue_jwt(user)
    return {
        "token": jwt_token,
        "user": {
            "email": user.email,
            "role": user.role,
            "name": user.name or "",
            "picture": user.profile_image or "",  # << เปลี่ยนให้ดึงจากฐานข้อมูล
        },
    }
