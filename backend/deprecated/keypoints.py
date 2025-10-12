import os
import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Video, VideoSegment
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter(prefix="/keypoints", tags=["keypoints"])

# Base directory for keypoints files
KEYPOINTS_DIR = Path(__file__).parent.parent.parent / "keypoints"
KEYPOINTS_DIR.mkdir(exist_ok=True)

# Pydantic models
class KeypointsData(BaseModel):
    keypoints: List[Dict[str, Any]]
    timestamp: float
    frame_index: int

class KeypointsUpload(BaseModel):
    keypoints_data: List[KeypointsData]

class KeypointsResponse(BaseModel):
    video_id: int
    segment_id: int
    keypoints_file: str
    message: str

def save_keypoints_to_file(video_id: int, segment_id: int, keypoints_data: List[Dict[str, Any]]) -> str:
    """
    Save keypoints data to JSON file
    Returns: file path relative to keypoints directory
    """
    filename = f"video_{video_id}_segment_{segment_id}.json"
    file_path = KEYPOINTS_DIR / filename
    
    # Create directory if it doesn't exist
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save keypoints to JSON file
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(keypoints_data, f, ensure_ascii=False, indent=2)
    
    return filename

def load_keypoints_from_file(keypoints_file: str) -> List[Dict[str, Any]]:
    """
    Load keypoints data from JSON file
    """
    file_path = KEYPOINTS_DIR / keypoints_file
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Keypoints file not found: {keypoints_file}"
        )
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to decode keypoints file"
        )

@router.post("/videos/{video_id}/segments/{segment_id}/upload", response_model=KeypointsResponse)
async def upload_keypoints(
    video_id: int,
    segment_id: int,
    keypoints_upload: KeypointsUpload,
    db: Session = Depends(get_db)
):
    """
    Upload and save keypoints for a video segment
    """
    # Check if video exists
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Check if segment exists
    segment = db.query(VideoSegment).filter(
        VideoSegment.id == segment_id,
        VideoSegment.video_id == video_id
    ).first()
    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video segment not found"
        )
    
    try:
        # Convert keypoints_data to dict format for JSON serialization
        keypoints_data_dict = []
        for item in keypoints_upload.keypoints_data:
            if hasattr(item, 'dict'):
                keypoints_data_dict.append(item.dict())
            elif isinstance(item, dict):
                keypoints_data_dict.append(item)
            else:
                keypoints_data_dict.append(dict(item))
        
        # Save keypoints to file
        filename = save_keypoints_to_file(video_id, segment_id, keypoints_data_dict)
        
        # Update segment with keypoints file path
        segment.keypoints_file = filename
        db.commit()
        
        return KeypointsResponse(
            video_id=video_id,
            segment_id=segment_id,
            keypoints_file=filename,
            message="Keypoints uploaded successfully"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save keypoints: {str(e)}"
        )

@router.get("/videos/{video_id}/segments/{segment_id}/load")
async def load_keypoints(
    video_id: int,
    segment_id: int,
    db: Session = Depends(get_db)
):
    """
    Load keypoints for a video segment from file
    """
    # Check if segment exists
    segment = db.query(VideoSegment).filter(
        VideoSegment.id == segment_id,
        VideoSegment.video_id == video_id
    ).first()
    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video segment not found"
        )
    
    if not segment.keypoints_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No keypoints file found for this segment"
        )
    
    # Load keypoints from file
    keypoints_data = load_keypoints_from_file(segment.keypoints_file)
    
    return {
        "video_id": video_id,
        "segment_id": segment_id,
        "keypoints_file": segment.keypoints_file,
        "keypoints_data": keypoints_data
    }

@router.get("/videos/{video_id}/segments")
async def get_video_segments_keypoints(
    video_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all segments with their keypoints file paths for a video
    """
    # Check if video exists
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Get all segments for this video
    segments = db.query(VideoSegment).filter(VideoSegment.video_id == video_id).all()
    
    segments_data = []
    for segment in segments:
        segment_info = {
            "segment_id": segment.id,
            "exercise_id": segment.exercise_id,
            "start_time": segment.start_time,
            "end_time": segment.end_time,
            "keypoints_file": segment.keypoints_file,
            "has_keypoints": segment.keypoints_file is not None
        }
        segments_data.append(segment_info)
    
    return {
        "video_id": video_id,
        "video_title": video.title,
        "segments": segments_data
    }

@router.delete("/videos/{video_id}/segments/{segment_id}/keypoints")
async def delete_keypoints(
    video_id: int,
    segment_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete keypoints file for a video segment
    """
    # Check if segment exists
    segment = db.query(VideoSegment).filter(
        VideoSegment.id == segment_id,
        VideoSegment.video_id == video_id
    ).first()
    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video segment not found"
        )
    
    if not segment.keypoints_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No keypoints file found for this segment"
        )
    
    try:
        # Delete file from disk
        file_path = KEYPOINTS_DIR / segment.keypoints_file
        if file_path.exists():
            file_path.unlink()
        
        # Remove file path from database
        segment.keypoints_file = None
        db.commit()
        
        return {
            "message": "Keypoints file deleted successfully",
            "video_id": video_id,
            "segment_id": segment_id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete keypoints: {str(e)}"
        )

# Comparison models
class TraineeKeypoints(BaseModel):
    keypoints: List[Dict[str, Any]]
    timestamp: float

class ComparisonResult(BaseModel):
    similarity_score: float
    feedback: str
    timestamp: float
    detailed_scores: Dict[str, float]

@router.post("/videos/{video_id}/segments/{segment_id}/compare", response_model=ComparisonResult)
async def compare_keypoints(
    video_id: int,
    segment_id: int,
    trainee_keypoints: TraineeKeypoints,
    db: Session = Depends(get_db)
):
    """
    Compare trainee keypoints with trainer keypoints at specific timestamp
    """
    # Check if segment exists and has keypoints file
    segment = db.query(VideoSegment).filter(
        VideoSegment.id == segment_id,
        VideoSegment.video_id == video_id
    ).first()
    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video segment not found"
        )
    
    if not segment.keypoints_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No keypoints file found for this segment"
        )
    
    # Load trainer keypoints from file
    trainer_keypoints_data = load_keypoints_from_file(segment.keypoints_file)
    
    # Find the closest timestamp in trainer keypoints
    target_timestamp = trainee_keypoints.timestamp
    closest_frame = None
    min_time_diff = float('inf')
    
    for frame in trainer_keypoints_data:
        time_diff = abs(frame.get('timestamp', 0) - target_timestamp)
        if time_diff < min_time_diff:
            min_time_diff = time_diff
            closest_frame = frame
    
    if not closest_frame or not closest_frame.get('pose_detected', False):
        return ComparisonResult(
            similarity_score=0.0,
            feedback="No trainer pose found at this timestamp",
            timestamp=target_timestamp,
            detailed_scores={}
        )
    
    # Compare poses
    trainer_pose = closest_frame.get('keypoints', [])
    trainee_pose = trainee_keypoints.keypoints
    
    if not trainer_pose or not trainee_pose:
        return ComparisonResult(
            similarity_score=0.0,
            feedback="Invalid pose data",
            timestamp=target_timestamp,
            detailed_scores={}
        )
    
    # Calculate overall similarity
    overall_score = calculate_pose_similarity(trainer_pose, trainee_pose)
    
    # Calculate detailed scores for different body parts
    detailed_scores = calculate_detailed_scores(trainer_pose, trainee_pose)
    
    # Generate feedback
    feedback = generate_feedback(overall_score, detailed_scores)
    
    return ComparisonResult(
        similarity_score=overall_score,
        feedback=feedback,
        timestamp=target_timestamp,
        detailed_scores=detailed_scores
    )

def calculate_pose_similarity(trainer_keypoints: List[Dict], trainee_keypoints: List[Dict]) -> float:
    """
    Calculate overall pose similarity score (0-1)
    """
    import numpy as np
    
    if len(trainer_keypoints) != len(trainee_keypoints):
        return 0.0
    
    total_similarity = 0.0
    valid_points = 0
    
    for i, (trainer_point, trainee_point) in enumerate(zip(trainer_keypoints, trainee_keypoints)):
        # Check visibility threshold
        trainer_vis = trainer_point.get('visibility', 0)
        trainee_vis = trainee_point.get('visibility', 0)
        
        if trainer_vis > 0.5 and trainee_vis > 0.5:
            # Calculate normalized distance
            dx = trainer_point['x'] - trainee_point['x']
            dy = trainer_point['y'] - trainee_point['y']
            distance = np.sqrt(dx*dx + dy*dy)
            
            # Convert to similarity score (closer = higher score)
            similarity = max(0, 1 - (distance * 2))  # Scale factor for sensitivity
            
            # Weight important joints more (e.g., shoulders, hips, knees)
            weight = get_joint_weight(i)
            total_similarity += similarity * weight
            valid_points += weight
    
    return total_similarity / valid_points if valid_points > 0 else 0.0

def calculate_detailed_scores(trainer_keypoints: List[Dict], trainee_keypoints: List[Dict]) -> Dict[str, float]:
    """
    Calculate detailed scores for different body parts
    """
    # MediaPipe pose landmark indices
    body_parts = {
        "head": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],  # Face and ears
        "arms": [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],  # Shoulders, elbows, wrists, hands
        "torso": [11, 12, 23, 24],  # Shoulders and hips
        "legs": [23, 24, 25, 26, 27, 28, 29, 30, 31, 32]  # Hips, knees, ankles, feet
    }
    
    detailed_scores = {}
    
    for part_name, indices in body_parts.items():
        part_score = 0.0
        valid_points = 0
        
        for idx in indices:
            if idx < len(trainer_keypoints) and idx < len(trainee_keypoints):
                trainer_point = trainer_keypoints[idx]
                trainee_point = trainee_keypoints[idx]
                
                trainer_vis = trainer_point.get('visibility', 0)
                trainee_vis = trainee_point.get('visibility', 0)
                
                if trainer_vis > 0.5 and trainee_vis > 0.5:
                    import numpy as np
                    dx = trainer_point['x'] - trainee_point['x']
                    dy = trainer_point['y'] - trainee_point['y']
                    distance = np.sqrt(dx*dx + dy*dy)
                    similarity = max(0, 1 - (distance * 2))
                    
                    part_score += similarity
                    valid_points += 1
        
        detailed_scores[part_name] = part_score / valid_points if valid_points > 0 else 0.0
    
    return detailed_scores

def get_joint_weight(joint_index: int) -> float:
    """
    Get weight for specific joint (more important joints have higher weights)
    """
    # MediaPipe pose landmark indices with weights
    important_joints = {
        11: 1.5,  # Left shoulder
        12: 1.5,  # Right shoulder
        13: 1.3,  # Left elbow
        14: 1.3,  # Right elbow
        15: 1.1,  # Left wrist
        16: 1.1,  # Right wrist
        23: 1.5,  # Left hip
        24: 1.5,  # Right hip
        25: 1.3,  # Left knee
        26: 1.3,  # Right knee
        27: 1.1,  # Left ankle
        28: 1.1,  # Right ankle
    }
    
    return important_joints.get(joint_index, 1.0)

def generate_feedback(overall_score: float, detailed_scores: Dict[str, float]) -> str:
    """
    Generate human-readable feedback based on scores
    """
    if overall_score >= 0.9:
        feedback = "Excellent form! Keep it up!"
    elif overall_score >= 0.8:
        feedback = "Great job! Your form is very good."
    elif overall_score >= 0.7:
        feedback = "Good form overall. "
    elif overall_score >= 0.6:
        feedback = "Your form needs some improvement. "
    else:
        feedback = "Focus on improving your form. "
    
    # Add specific feedback for body parts
    suggestions = []
    for part, score in detailed_scores.items():
        if score < 0.6:
            if part == "arms":
                suggestions.append("Pay attention to your arm positioning")
            elif part == "legs":
                suggestions.append("Check your leg alignment")
            elif part == "torso":
                suggestions.append("Keep your torso aligned")
    
    if suggestions:
        feedback += " " + ". ".join(suggestions) + "."
    
    return feedback

# Processing endpoints
class ExtractRequest(BaseModel):
    video_id: int
    segment_id: int

@router.post("/extract-segment")
async def extract_segment_keypoints(
    request: ExtractRequest,
    db: Session = Depends(get_db)
):
    """
    Extract keypoints for a specific segment (called from frontend after video upload)
    """
    try:
        # Import here to avoid circular imports
        from app.utils.keypoints_extractor import KeypointsExtractor
        from pathlib import Path
        
        # Check if segment exists
        segment = db.query(VideoSegment).filter(
            VideoSegment.id == request.segment_id,
            VideoSegment.video_id == request.video_id
        ).first()
        if not segment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video segment not found"
            )
        
        # Get video info
        video = db.query(Video).filter(Video.id == request.video_id).first()
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found"
            )
        
        # Construct video file path
        # Assuming videos are stored in uploaded_videos directory
        backend_dir = Path(__file__).parent.parent.parent
        
        # Try to get filename from s3_url or use default pattern
        if video.s3_url:
            video_filename = video.s3_url.split('/')[-1]
        else:
            video_filename = f"video_{video.id}.mp4"
            
        video_path = backend_dir / "uploaded_videos" / video_filename
        
        if not video_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Video file not found: {video_filename}"
            )
        
        # Extract keypoints
        extractor = KeypointsExtractor()
        keypoints_data = extractor.extract_keypoints_from_video(
            video_path=str(video_path),
            start_time=segment.start_time,
            end_time=segment.end_time
        )
        
        # Save keypoints to file
        filename = save_keypoints_to_file(request.video_id, request.segment_id, keypoints_data)
        
        # Update segment with keypoints file path
        segment.keypoints_file = filename
        db.commit()
        
        return {
            "success": True,
            "video_id": request.video_id,
            "segment_id": request.segment_id,
            "keypoints_file": filename,
            "frames_count": len(keypoints_data),
            "message": "Keypoints extracted successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract keypoints: {str(e)}"
        )

@router.post("/extract-video/{video_id}")
async def extract_video_keypoints(
    video_id: int,
    db: Session = Depends(get_db)
):
    """
    Extract keypoints for all segments of a video
    """
    try:
        # Check if video exists
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found"
            )
        
        # Get all segments for this video
        segments = db.query(VideoSegment).filter(VideoSegment.video_id == video_id).all()
        
        if not segments:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No segments found for this video"
            )
        
        results = []
        processed_count = 0
        
        for segment in segments:
            try:
                # Skip if segment already has keypoints
                if segment.keypoints_file:
                    results.append({
                        "segment_id": segment.id,
                        "status": "skipped",
                        "message": "Already has keypoints",
                        "keypoints_file": segment.keypoints_file
                    })
                    continue
                
                # Extract keypoints for this segment
                extract_request = ExtractRequest(video_id=video_id, segment_id=segment.id)
                result = await extract_segment_keypoints(extract_request, db)
                
                results.append({
                    "segment_id": segment.id,
                    "status": "success",
                    "keypoints_file": result["keypoints_file"],
                    "frames_count": result["frames_count"]
                })
                processed_count += 1
                
            except Exception as e:
                results.append({
                    "segment_id": segment.id,
                    "status": "error",
                    "message": str(e)
                })
        
        return {
            "success": True,
            "video_id": video_id,
            "total_segments": len(segments),
            "processed_segments": processed_count,
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process video keypoints: {str(e)}"
        )