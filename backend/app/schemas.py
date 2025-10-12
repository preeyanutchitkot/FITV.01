# app/schemas.py
from pydantic import BaseModel, EmailStr
from datetime import datetime


class InviteRequest(BaseModel):
    email: EmailStr

class TraineeListItem(BaseModel):
    id: int
    name: str | None = None
    email: str | None = None
    profile_image: str | None = None  # เพิ่ม field รูปโปรไฟล์
    is_online: bool = False  # เพิ่ม field สถานะออนไลน์

    class Config:
        from_attributes = True

class TrainerListItem(BaseModel):
    id: int
    name: str | None = None
    email: str | None = None
    profile_image: str | None = None  # เพิ่ม field รูปโปรไฟล์

    class Config:
        from_attributes = True

class TrainerProfile(BaseModel):
    id: int
    name: str | None = None
    email: str | None = None
    points: int
    streak: int
    profile_image: str | None = None  # เพิ่ม field รูปโปรไฟล์
    is_online: bool = False
    last_active: datetime | None = None

    class Config:
        from_attributes = True

class TraineeProfile(BaseModel):
    id: int
    name: str | None = None
    points: int
    streak: int
    profile_image: str | None = None  # เพิ่ม field รูปโปรไฟล์
    is_online: bool = False
    last_active: datetime | None = None

    class Config:
        from_attributes = True
