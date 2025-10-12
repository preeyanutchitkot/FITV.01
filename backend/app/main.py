from fastapi import FastAPI, Depends, HTTPException, Request, Body, Response, status
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import Comment, User, WorkoutLog, Invite, TrainerTrainee
from app.schemas import TrainerProfile
from app.routers import invite, trainee, trainer, admin, ai_feedback
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, PlainTextResponse
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import jwt
from datetime import datetime, timedelta
import random
from app.utils.email_sender import send_invitation_email
from threading import Lock

# In-memory store for login codes: {email: {"code": "123456", "expires": datetime}}
login_codes = {}
login_codes_lock = Lock()

# โหลด environment variables
load_dotenv()

# Import routers
from app.oauth import router as oauth_router


app = FastAPI()

app.include_router(admin.router) 
# Serve static files for video preview with CORS
import pathlib
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class CORSStaticFilesMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/static/"):
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, HEAD, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "*"
        return response

STATIC_VIDEO_DIR = str(pathlib.Path(__file__).parent.parent / "uploaded_videos")
app.mount("/static", StaticFiles(directory=STATIC_VIDEO_DIR), name="static")
app.add_middleware(CORSStaticFilesMiddleware)

# Video proxy endpoint for S3 CORS issues
import httpx
import io
from fastapi.responses import StreamingResponse
from fastapi import Header
from typing import Optional

@app.get("/video-proxy")
async def video_proxy(url: str, range: Optional[str] = Header(None)):
    """Proxy video from S3 to avoid CORS issues with streaming support"""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    # Add range header if provided (for video seeking)
    if range:
        headers["Range"] = range
    
    # Use connection pooling for better performance
    timeout = httpx.Timeout(30.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        try:
            response = await client.get(url, headers=headers)
            
            if response.status_code in [200, 206]:  # 206 for partial content
                # Prepare response headers
                response_headers = {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Accept-Ranges": "bytes",
                    "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
                }
                
                # Copy important headers from original response
                for header in ["Content-Length", "Content-Range", "Content-Type"]:
                    if header in response.headers:
                        response_headers[header] = response.headers[header]
                
                # Set content type if not already set
                if "Content-Type" not in response_headers:
                    response_headers["Content-Type"] = "video/mp4"
                
                # Stream the response
                async def generate():
                    async for chunk in response.aiter_bytes(chunk_size=8192):
                        yield chunk
                
                return StreamingResponse(
                    generate(),
                    status_code=response.status_code,
                    headers=response_headers
                )
                    
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Video server timeout")
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Video not found: {str(e)}")
    
    raise HTTPException(status_code=404, detail="Video not found")

# Add OPTIONS handler for CORS preflight
@app.options("/video-proxy")
async def video_proxy_options():
    return Response(
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Middleware
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET", "defaultsecret"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Set to False when using allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Background job: set is_online=False for inactive users ---
import threading
import time
from sqlalchemy import and_

def offline_inactive_users_job():
    while True:
        try:
            db = SessionLocal()
            now = datetime.utcnow()
            threshold = now - timedelta(minutes=5)
            # หา user ที่ last_active < threshold และ is_online=True
            users = db.query(User).filter(and_(User.is_online == True, User.last_active != None, User.last_active < threshold)).all()
            for u in users:
                u.is_online = False
                db.add(u)
            if users:
                db.commit()
            db.close()
        except Exception as e:
            print(f"[offline_inactive_users_job] error: {e}")
        time.sleep(60)  # check ทุก 1 นาที

# Start background thread
threading.Thread(target=offline_inactive_users_job, daemon=True).start()
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda r, e: PlainTextResponse(str(e), status_code=429))

# Import video_segments router
from app.routers import video_segments

# Include routers
app.include_router(oauth_router)
app.include_router(video_segments.router)
# include optional routers if present
try:
    app.include_router(invite.router)
except Exception:
    if hasattr(invite, "router"):
        app.include_router(invite.router)
try:
    app.include_router(trainee.router)
except Exception:
    if hasattr(trainee, "router"):
        app.include_router(trainee.router)
try:
    app.include_router(trainer.router)
except Exception:
    if hasattr(trainer, "router"):
        app.include_router(trainer.router)
try:
    app.include_router(ai_feedback.router)
except Exception:
    if hasattr(ai_feedback, "router"):
        app.include_router(ai_feedback.router)


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Online status ping endpoint ---
@app.post("/users/ping", status_code=status.HTTP_204_NO_CONTENT)
def user_ping(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split(" ", 1)[1]
    JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user.is_online = True
        user.last_active = datetime.utcnow()
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# helper dependency: decode JWT and return User
def get_current_user_dep(request: Request, db: Session = Depends(get_db)) -> User:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split(" ", 1)[1]
    JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# Root
@app.get("/")
def root():
    return {"message": "Welcome to Fitaddict API"}

# สำหรับ login ด้วย email/password
class LoginRequest(BaseModel):
    email: str

class EmailRequest(BaseModel):
    email: str

class EmailCodeVerifyRequest(BaseModel):
    email: str
    code: str

@app.post("/login/request")
def request_login_code(data: EmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        user = User(email=data.email, role="uninvited", status="uninvited")
        db.add(user)
        db.commit()
        db.refresh(user)
    code = f"{random.randint(100000, 999999)}"
    expires = datetime.utcnow() + timedelta(minutes=10)
    with login_codes_lock:
        login_codes[data.email] = {"code": code, "expires": expires}
    try:
        from app.utils.email_sender import send_login_code_email
        send_login_code_email(to_email=data.email, code=code)
        print(f"[DEBUG] Login code for {data.email}: {code}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")
    return {"msg": "Login code sent to your email"}

@app.post("/login/verify")
def verify_login_code(data: EmailCodeVerifyRequest, db: Session = Depends(get_db)):
    with login_codes_lock:
        entry = login_codes.get(data.email)
    if not entry or entry["code"] != data.code:
        raise HTTPException(status_code=401, detail="Invalid or expired code")
    if entry["expires"] < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Code expired")
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "uninvited":
        raise HTTPException(status_code=403, detail="uninvited: กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์การเข้าใช้งาน")
    # Update online status on successful login
    user.is_online = True
    user.last_active = datetime.utcnow()
    db.commit()
    with login_codes_lock:
        login_codes.pop(data.email, None)
    JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
    payload = {
        "user_id": user.id,
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return {
        "user": {
            "email": user.email,
            "role": (user.role or "").lower(),
            "name": user.name or ""
        },
        "token": token
    }

@app.post("/login")
def login_user(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.role == "uninvited":
        raise HTTPException(status_code=403, detail="uninvited: กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์การเข้าใช้งาน")
    # Set online status and last_active on login
    user.is_online = True
    user.last_active = datetime.utcnow()
    db.commit()
    return {
        "user": {
            "email": user.email,
            "role": (user.role or "").lower(),
            "name": user.name or ""
        }
    }



@app.get("/workout_logs")
def get_workout_logs(db: Session = Depends(get_db)):
    return db.query(WorkoutLog).all()

@app.get("/users")
@limiter.limit("5/minute")
def get_users(request: Request, db: Session = Depends(get_db)):
    return db.query(User).all()

@app.get("/invites")
def get_invites(db: Session = Depends(get_db)):
    return db.query(Invite).all()

@app.get("/accept")
def accept_invitation(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "trainer" and user.status == "pending_trainer":
        user.status = "trainer"
        db.commit()
        return RedirectResponse(url="http://localhost:3000")
    if user.role == "trainee" and user.status == "pending":
        user.status = "trainee"
        db.commit()
        return RedirectResponse(url="http://localhost:3000")
    return RedirectResponse(url="http://localhost:3000")

@app.get("/me")
def get_current_user(request: Request, db: Session = Depends(get_db)):
    # reuse dependency logic
    return get_current_user_dep(request, db)

# ----- Application endpoints: /my-trainer and /invite (use dependency) -----
@app.get("/my-trainer", response_model=TrainerProfile)
def get_my_trainer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    relation = (
        db.query(TrainerTrainee)
        .filter(TrainerTrainee.trainee_id == current_user.id)
        .first()
    )
    if not relation:
        raise HTTPException(status_code=404, detail="No trainer found for this trainee")
    trainer = db.query(User).filter(User.id == relation.trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    return trainer

@app.post("/invite")
def invite_trainee(
    email: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    trainee = db.query(User).filter(User.email == email).first()
    if not trainee:
        trainee = User(
            email=email,
            role="invited_trainee",
            status="pending"
        )
        db.add(trainee)
        db.commit()
        db.refresh(trainee)
    else:
        trainee.role = "invited_trainee"
        trainee.status = "pending"
        db.commit()
        db.refresh(trainee)

    relation = db.query(TrainerTrainee).filter(
        TrainerTrainee.trainer_id == current_user.id,
        TrainerTrainee.trainee_id == trainee.id
    ).first()
    if not relation:
        relation = TrainerTrainee(
            trainer_id=current_user.id,
            trainee_id=trainee.id
        )
        db.add(relation)
        db.commit()

    # optional: send invite email
    try:
        send_invitation_email(to_email=email, inviter=current_user)
    except Exception:
        pass

    return {"msg": "Invite success"}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/users/logout", status_code=204)
def user_logout(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split(" ")[1]
    JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_online = False
        db.commit()
    return Response(status_code=204)
