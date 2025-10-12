import cv2
import mediapipe as mp
import json
import requests
from pathlib import Path
from typing import List, Dict, Any
import numpy as np

class KeypointsExtractor:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils

    def extract_keypoints_from_video(self, video_path: str, start_time: float = 0, end_time: float = None) -> List[Dict[str, Any]]:
        """
        Extract keypoints from video segment
        
        Args:
            video_path: Path to video file
            start_time: Start time in seconds
            end_time: End time in seconds (None = end of video)
            
        Returns:
            List of keypoints data for each frame
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Calculate frame range
        start_frame = int(start_time * fps)
        end_frame = int(end_time * fps) if end_time else total_frames
        
        # Set video position to start frame
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
        
        keypoints_data = []
        current_frame = start_frame
        
        while current_frame < end_frame:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process frame with MediaPipe
            results = self.pose.process(rgb_frame)
            
            # Extract keypoints
            if results.pose_landmarks:
                landmarks = []
                for landmark in results.pose_landmarks.landmark:
                    landmarks.append({
                        "x": landmark.x,
                        "y": landmark.y,
                        "z": landmark.z,
                        "visibility": landmark.visibility
                    })
                
                keypoints_data.append({
                    "frame_index": current_frame,
                    "timestamp": current_frame / fps,
                    "keypoints": landmarks,
                    "pose_detected": True
                })
            else:
                # No pose detected in this frame
                keypoints_data.append({
                    "frame_index": current_frame,
                    "timestamp": current_frame / fps,
                    "keypoints": [],
                    "pose_detected": False
                })
            
            current_frame += 1
        
        cap.release()
        return keypoints_data

    def save_keypoints_to_api(self, video_id: int, segment_id: int, keypoints_data: List[Dict[str, Any]], api_base_url: str = "http://localhost:8000"):
        """
        Save keypoints to API endpoint
        """
        url = f"{api_base_url}/keypoints/videos/{video_id}/segments/{segment_id}/upload"
        
        payload = {
            "keypoints_data": keypoints_data
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        return response.json()

    def load_keypoints_from_api(self, video_id: int, segment_id: int, api_base_url: str = "http://localhost:8000"):
        """
        Load keypoints from API endpoint
        """
        url = f"{api_base_url}/keypoints/videos/{video_id}/segments/{segment_id}/load"
        
        response = requests.get(url)
        response.raise_for_status()
        
        return response.json()

def compare_poses(trainer_keypoints: List[Dict], trainee_keypoints: List[Dict]) -> float:
    """
    Compare poses between trainer and trainee keypoints
    Returns similarity score (0-1, higher is better)
    """
    if not trainer_keypoints or not trainee_keypoints:
        return 0.0
    
    # Simple comparison based on joint positions
    # This is a basic implementation - you can improve it with more sophisticated algorithms
    
    total_similarity = 0.0
    valid_comparisons = 0
    
    for trainer_point, trainee_point in zip(trainer_keypoints, trainee_keypoints):
        if (trainer_point.get('visibility', 0) > 0.5 and 
            trainee_point.get('visibility', 0) > 0.5):
            
            # Calculate Euclidean distance
            dx = trainer_point['x'] - trainee_point['x']
            dy = trainer_point['y'] - trainee_point['y']
            distance = np.sqrt(dx*dx + dy*dy)
            
            # Convert distance to similarity (closer = more similar)
            similarity = max(0, 1 - distance)
            total_similarity += similarity
            valid_comparisons += 1
    
    if valid_comparisons == 0:
        return 0.0
    
    return total_similarity / valid_comparisons

# Example usage
if __name__ == "__main__":
    extractor = KeypointsExtractor()
    
    # Example: Extract keypoints from a video segment
    video_path = "path/to/your/video.mp4"
    video_id = 1
    segment_id = 1
    start_time = 10.0  # Start at 10 seconds
    end_time = 20.0    # End at 20 seconds
    
    try:
        # Extract keypoints
        print("Extracting keypoints...")
        keypoints_data = extractor.extract_keypoints_from_video(
            video_path=video_path,
            start_time=start_time,
            end_time=end_time
        )
        
        print(f"Extracted {len(keypoints_data)} frames of keypoints")
        
        # Save to API
        print("Saving to API...")
        result = extractor.save_keypoints_to_api(video_id, segment_id, keypoints_data)
        print("Saved successfully:", result)
        
        # Load from API (for testing)
        print("Loading from API...")
        loaded_data = extractor.load_keypoints_from_api(video_id, segment_id)
        print(f"Loaded {len(loaded_data['keypoints_data'])} frames")
        
    except Exception as e:
        print(f"Error: {e}")