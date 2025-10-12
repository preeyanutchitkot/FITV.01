from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class VideoCreate(BaseModel):
    title: str
    difficulty: Optional[str] = None
    description: Optional[str] = None

class VideoOut(BaseModel):
    id: int
    title: str
    trainer_id: int
    difficulty: Optional[str] = None
    description: Optional[str] = None
    s3_url: Optional[str] = None
    keypoints: Optional[Any] = None

    approved: Optional[bool] = None
    approved_at: Optional[datetime] = None
    rejected: Optional[bool] = None
    reject_reason: Optional[str] = None
    rejected_at: Optional[datetime] = None

    duration: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class VideoUpdate(BaseModel):
    title: Optional[str] = None
    difficulty: Optional[str] = None
    description: Optional[str] = None
