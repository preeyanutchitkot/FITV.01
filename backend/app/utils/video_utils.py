import subprocess
import json
import os
from pathlib import Path

def get_video_duration(video_path):
    """
    ใช้ ffprobe ดึง duration ของวิดีโอ (หน่วยเป็นวินาที)
    """
    try:
        # ตรวจสอบว่าไฟล์มีอยู่หรือไม่
        if not os.path.exists(video_path):
            print(f"[VIDEO_UTILS] File not found: {video_path}")
            return None
            
        # ใช้ ffprobe ดึง metadata
        cmd = [
            'ffprobe',
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            video_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            print(f"[VIDEO_UTILS] ffprobe error: {result.stderr}")
            return None
            
        data = json.loads(result.stdout)
        
        # หา duration จาก format หรือ streams
        duration = None
        
        # วิธีที่ 1: ดึงจาก format
        if 'format' in data and 'duration' in data['format']:
            duration = float(data['format']['duration'])
            
        # วิธีที่ 2: ดึงจาก video stream
        if duration is None and 'streams' in data:
            for stream in data['streams']:
                if stream.get('codec_type') == 'video' and 'duration' in stream:
                    duration = float(stream['duration'])
                    break
                    
        if duration is not None:
            # แปลงเป็นจำนวนเต็ม (วินาที)
            duration_int = int(round(duration))
            print(f"[VIDEO_UTILS] Duration for {video_path}: {duration_int} seconds")
            return duration_int
        else:
            print(f"[VIDEO_UTILS] Could not extract duration from {video_path}")
            return None
            
    except subprocess.TimeoutExpired:
        print(f"[VIDEO_UTILS] ffprobe timeout for {video_path}")
        return None
    except json.JSONDecodeError as e:
        print(f"[VIDEO_UTILS] JSON decode error: {e}")
        return None
    except Exception as e:
        print(f"[VIDEO_UTILS] Unexpected error: {e}")
        return None

def update_video_duration(video_id, db):
    """
    อัปเดต duration ของวิดีโอในฐานข้อมูลจากไฟล์จริง
    """
    from app.models import Video
    
    try:
        # ดึงข้อมูลวิดีโอจากฐานข้อมูล
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video or not video.s3_url:
            print(f"[VIDEO_UTILS] Video {video_id} not found or no s3_url")
            return False
            
        # สร้าง path ของไฟล์วิดีโอ
        if video.s3_url.startswith('/static/'):
            filename = video.s3_url.replace('/static/', '')
        else:
            filename = video.s3_url
            
        video_path = Path(__file__).parent.parent.parent / "uploaded_videos" / filename
        
        # ดึง duration จากไฟล์
        duration = get_video_duration(str(video_path))
        
        if duration is not None:
            # อัปเดตในฐานข้อมูล
            video.duration = duration
            db.commit()
            print(f"[VIDEO_UTILS] Updated video {video_id} duration to {duration} seconds")
            return True
        else:
            print(f"[VIDEO_UTILS] Failed to get duration for video {video_id}")
            return False
            
    except Exception as e:
        print(f"[VIDEO_UTILS] Error updating video {video_id} duration: {e}")
        db.rollback()
        return False