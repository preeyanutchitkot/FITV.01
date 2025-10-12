import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Video, VideoSegment, Exercise
from pydantic import BaseModel
from typing import List, Optional
import logging

router = APIRouter(prefix="/videos", tags=["video_segments"])

logger = logging.getLogger(__name__)

# Pydantic models
class SegmentCreate(BaseModel):
    exercise_id: int
    start_time: float
    end_time: float

class SegmentResponse(BaseModel):
    id: int
    exercise_id: int
    start_time: float
    end_time: float

class SegmentListResponse(BaseModel):
    video_id: int
    video_title: str
    segments: List[SegmentResponse]

@router.post("/{video_id}/segments", response_model=SegmentResponse)
async def create_segment(
    video_id: int,
    segment_data: SegmentCreate,
    db: Session = Depends(get_db)
):
    """
    สร้าง segment ใหม่
    """
    # ตรวจสอบว่า video มีอยู่จริง
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # ตรวจสอบว่า exercise มีอยู่จริง
    exercise = db.query(Exercise).filter(Exercise.id == segment_data.exercise_id).first()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found"
        )
    
    # ตรวจสอบเวลา
    if segment_data.start_time >= segment_data.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start time must be less than end time"
        )
    
    if segment_data.start_time < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start time cannot be negative"
        )
    
    # สร้าง segment ใหม่
    try:
        new_segment = VideoSegment(
            video_id=video_id,
            exercise_id=segment_data.exercise_id,
            start_time=segment_data.start_time,
            end_time=segment_data.end_time
        )
        
        db.add(new_segment)
        db.commit()
        db.refresh(new_segment)
        
        logger.info(f"✅ Created segment {new_segment.id} for video {video_id}")
        
        return SegmentResponse(
            id=new_segment.id,
            exercise_id=new_segment.exercise_id,
            start_time=new_segment.start_time,
            end_time=new_segment.end_time
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error creating segment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create segment: {str(e)}"
        )

@router.get("/{video_id}/segments", response_model=SegmentListResponse)
async def get_video_segments(
    video_id: int,
    db: Session = Depends(get_db)
):
    """
    ดึงรายการ segments ทั้งหมดของ video
    """
    # ตรวจสอบว่า video มีอยู่จริง
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # ดึง segments ทั้งหมด
    segments = db.query(VideoSegment).filter(VideoSegment.video_id == video_id).all()
    
    segments_response = []
    for segment in segments:
        segments_response.append(SegmentResponse(
            id=segment.id,
            exercise_id=segment.exercise_id,
            start_time=segment.start_time,
            end_time=segment.end_time
        ))
    
    return SegmentListResponse(
        video_id=video_id,
        video_title=video.title or "Untitled Video",
        segments=segments_response
    )

@router.delete("/{video_id}/segments/{segment_id}")
async def delete_segment(
    video_id: int,
    segment_id: int,
    db: Session = Depends(get_db)
):
    """
    ลบ segment
    """
    # ตรวจสอบว่า segment มีอยู่จริง
    segment = db.query(VideoSegment).filter(
        VideoSegment.id == segment_id,
        VideoSegment.video_id == video_id
    ).first()
    
    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Segment not found"
        )
    
    try:
        # ลบ segment จาก database
        db.delete(segment)
        db.commit()
        
        logger.info(f"✅ Deleted segment {segment_id}")
        
        return {"message": "Segment deleted successfully"}
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error deleting segment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete segment: {str(e)}"
        )

