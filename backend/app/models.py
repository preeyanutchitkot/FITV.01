
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Float, JSON, Text, TIMESTAMP,DateTime
from sqlalchemy.orm import declarative_base
from app.db import Base  
from sqlalchemy.sql import func
from datetime import datetime

class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)

# ...existing code...

# Trainer-Trainee relationship table
class TrainerTrainee(Base):
    __tablename__ = "trainer_trainee"
    id = Column(Integer, primary_key=True)
    trainer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    trainee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Float, JSON, Text, TIMESTAMP
from sqlalchemy.orm import declarative_base
from app.db import Base  
from sqlalchemy.sql import func
from datetime import datetime

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    workout_log_id = Column(Integer, ForeignKey("workout_logs.id"))
    content = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    google_uid = Column(String(100), unique=True) 
    name = Column(String(100))
    role = Column(String(50), nullable=False)    
    status = Column(String(50), default="pending", nullable=False)
    points = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())
    profile_image = Column(String(255))  # รูปโปรไฟล์
    is_online = Column(Boolean, default=False)
    last_active = Column(DateTime(timezone=True), nullable=True)


class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    video_id = Column(Integer, ForeignKey("videos.id"))
    keypoints = Column(JSON)
    comparison_score = Column(Float)
    completed_at = Column(TIMESTAMP)


class Video(Base):
    __tablename__ = 'videos'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    trainer_id = Column(Integer, ForeignKey("users.id"))
    difficulty = Column(String(50))
    description = Column(Text)
    s3_url = Column(Text)
    keypoints = Column(JSON)

    approved    = Column(Boolean, default=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    rejected      = Column(Boolean, default=False)
    reject_reason = Column(Text, nullable=True)
    rejected_at   = Column(DateTime(timezone=True), nullable=True)

    duration = Column(Integer, nullable=True)  # duration in seconds

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    muscle_group = Column(String(50), nullable=True)


class VideoSegment(Base):
    __tablename__ = "video_segments"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    start_time = Column(Float, nullable=False)  # seconds
    end_time = Column(Float, nullable=False)    # seconds



class Invite(Base):
    __tablename__ = "invites"

    id = Column(Integer, primary_key=True)
    email = Column(String, nullable=False)
    token = Column(String, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
