"""
Script สำหรับ extract keypoints จากวิดีโอและบันทึกลง database (ปรับปรุงแล้ว)
รันสคริปต์นี้เพื่อประมวลผลวิดีโอที่มีอยู่ในระบบ
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import cv2
from pathlib import Path
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import Video, VideoSegment
from app.utils.keypoints_extractor import KeypointsExtractor
import requests
import argparse

async def process_video_segments():
    """
    ประมวลผล video segments ทั้งหมดที่ยังไม่มี keypoints
    """
    db = SessionLocal()
    extractor = KeypointsExtractor()
    
    try:
        # หา video segments ที่ยังไม่มี keypoints_file
        segments = db.query(VideoSegment).filter(
            VideoSegment.keypoints_file.is_(None)
        ).all()
        
        print(f"Found {len(segments)} segments without keypoints")
        
        for segment in segments:
            try:
                # ดึงข้อมูลวิดีโอ
                video = db.query(Video).filter(Video.id == segment.video_id).first()
                if not video:
                    print(f"Video not found for segment {segment.id}")
                    continue
                
                print(f"Processing segment {segment.id} of video {video.id}: {video.title}")
                
                # สร้าง path ของวิดีโอ
                video_filename = video.s3_url.split('/')[-1] if video.s3_url else f"video_{video.id}.mp4"
                video_path = Path(__file__).parent.parent / "uploaded_videos" / video_filename
                
                # ถ้าไม่เจอไฟล์ตามชื่อใน S3 ให้ลองใช้ไฟล์ที่มีอยู่
                if not video_path.exists():
                    print(f"Video file not found: {video_path}")
                    print("Trying to find alternative video files...")
                    
                    # ลองหาไฟล์วิดีโอที่มีอยู่ในโฟลเดอร์
                    video_dir = Path(__file__).parent.parent / "uploaded_videos"
                    available_videos = list(video_dir.glob("*.mp4")) + list(video_dir.glob("*.mov"))
                    
                    if available_videos:
                        # ใช้ไฟล์แรกที่เจอ
                        video_path = available_videos[0]
                        print(f"Using alternative video file: {video_path}")
                    else:
                        print("No video files found in uploaded_videos directory")
                        continue
                
                # Extract keypoints สำหรับ segment นี้
                keypoints_data = extractor.extract_keypoints_from_video(
                    video_path=str(video_path),
                    start_time=segment.start_time,
                    end_time=segment.end_time
                )
                
                print(f"Extracted {len(keypoints_data)} frames of keypoints")
                
                # บันทึกผ่าน API
                try:
                    result = extractor.save_keypoints_to_api(
                        video_id=video.id,
                        segment_id=segment.id,
                        keypoints_data=keypoints_data,
                        api_base_url="http://localhost:8000"
                    )
                    print(f"Saved keypoints: {result['keypoints_file']}")
                    
                except requests.exceptions.RequestException as e:
                    print(f"API error for segment {segment.id}: {e}")
                    continue
                
            except Exception as e:
                print(f"Error processing segment {segment.id}: {e}")
                continue
        
        print("Processing completed!")
        
    finally:
        db.close()

async def process_single_video(video_id: int):
    """
    ประมวลผลวิดีโอเฉพาะ ID ที่กำหนด
    """
    db = SessionLocal()
    extractor = KeypointsExtractor()
    
    try:
        # หาวิดีโอที่ต้องการ
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            print(f"Video {video_id} not found")
            return
        
        print(f"Processing video {video_id}: {video.title}")
        
        # หา segments ของวิดีโอนี้
        segments = db.query(VideoSegment).filter(
            VideoSegment.video_id == video_id
        ).all()
        
        if not segments:
            print(f"No segments found for video {video_id}")
            return
        
        # สร้าง path ของวิดีโอ
        video_filename = video.s3_url.split('/')[-1] if video.s3_url else f"video_{video.id}.mp4"
        video_path = Path(__file__).parent.parent / "uploaded_videos" / video_filename
        
        # ถ้าไม่เจอไฟล์ตามชื่อใน S3 ให้ลองใช้ไฟล์ที่มีอยู่  
        if not video_path.exists():
            print(f"Video file not found: {video_path}")
            print("Trying to find alternative video files...")
            
            # ลองหาไฟล์วิดีโอที่มีอยู่ในโฟลเดอร์
            video_dir = Path(__file__).parent.parent / "uploaded_videos"
            available_videos = list(video_dir.glob("*.mp4")) + list(video_dir.glob("*.mov"))
            
            if available_videos:
                # ใช้ไฟล์แรกที่เจอ
                video_path = available_videos[0]
                print(f"Using alternative video file: {video_path}")
            else:
                print("No video files found in uploaded_videos directory")
                return
        
        # ประมวลผล segments
        for segment in segments:
            if segment.keypoints_file:
                print(f"Segment {segment.id} already has keypoints, skipping...")
                continue
            
            try:
                print(f"Processing segment {segment.id} ({segment.start_time}s - {segment.end_time}s)")
                
                # Extract keypoints
                keypoints_data = extractor.extract_keypoints_from_video(
                    video_path=str(video_path),
                    start_time=segment.start_time,
                    end_time=segment.end_time
                )
                
                print(f"Extracted {len(keypoints_data)} frames of keypoints")
                
                # บันทึกผ่าน API
                result = extractor.save_keypoints_to_api(
                    video_id=video.id,
                    segment_id=segment.id,
                    keypoints_data=keypoints_data,
                    api_base_url="http://localhost:8000"
                )
                print(f"Saved keypoints: {result['keypoints_file']}")
                
            except Exception as e:
                print(f"Error processing segment {segment.id}: {e}")
                continue
        
        print(f"Video {video_id} processing completed!")
        
    finally:
        db.close()

def list_videos():
    """
    แสดงรายการวิดีโอทั้งหมดในระบบ
    """
    db = SessionLocal()
    
    try:
        videos = db.query(Video).all()
        
        print("\n=== Available Videos ===")
        for video in videos:
            segments_count = db.query(VideoSegment).filter(
                VideoSegment.video_id == video.id
            ).count()
            
            segments_with_keypoints = db.query(VideoSegment).filter(
                VideoSegment.video_id == video.id,
                VideoSegment.keypoints_file.isnot(None)
            ).count()
            
            print(f"ID: {video.id}")
            print(f"Title: {video.title}")
            print(f"Trainer ID: {video.trainer_id}")
            print(f"Segments: {segments_count} (keypoints: {segments_with_keypoints})")
            print(f"Duration: {video.duration}s")
            print(f"S3 URL: {video.s3_url}")
            print("-" * 50)
        
    finally:
        db.close()

def check_keypoints_status():
    """
    ตรวจสอบสถานะ keypoints ในระบบ
    """
    db = SessionLocal()
    
    try:
        total_segments = db.query(VideoSegment).count()
        segments_with_keypoints = db.query(VideoSegment).filter(
            VideoSegment.keypoints_file.isnot(None)
        ).count()
        segments_without_keypoints = total_segments - segments_with_keypoints
        
        print("\n=== Keypoints Status ===")
        print(f"Total segments: {total_segments}")
        print(f"With keypoints: {segments_with_keypoints}")
        print(f"Without keypoints: {segments_without_keypoints}")
        
        if segments_without_keypoints > 0:
            print(f"\nSegments without keypoints:")
            segments = db.query(VideoSegment).filter(
                VideoSegment.keypoints_file.is_(None)
            ).all()
            
            for segment in segments:
                video = db.query(Video).filter(Video.id == segment.video_id).first()
                print(f"- Segment {segment.id} (Video: {video.title if video else 'Unknown'})")
        
    finally:
        db.close()

async def main():
    parser = argparse.ArgumentParser(description='Extract keypoints from videos')
    parser.add_argument('--video-id', type=int, help='Process specific video ID')
    parser.add_argument('--all', action='store_true', help='Process all videos without keypoints')
    parser.add_argument('--list', action='store_true', help='List all videos')
    parser.add_argument('--status', action='store_true', help='Check keypoints status')
    
    args = parser.parse_args()
    
    if args.list:
        list_videos()
    elif args.status:
        check_keypoints_status()
    elif args.video_id:
        await process_single_video(args.video_id)
    elif args.all:
        await process_video_segments()
    else:
        print("Usage examples:")
        print("python extract_keypoints.py --list                 # List all videos")
        print("python extract_keypoints.py --status               # Check keypoints status")
        print("python extract_keypoints.py --video-id 1           # Process video ID 1")
        print("python extract_keypoints.py --all                  # Process all videos")

if __name__ == "__main__":
    asyncio.run(main())