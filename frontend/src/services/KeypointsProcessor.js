// KeypointsProcessor.js - Service สำหรับประมวลผล keypoints หลัง upload video

class KeypointsProcessor {
    constructor(baseURL = 'http://localhost:8000') {
        this.baseURL = baseURL;
    }

    // เริ่มต้นการประมวลผล keypoints สำหรับวิดีโอที่ upload ใหม่ - DISABLED
    async processVideoKeypoints(videoId, onProgress = null) {
        try {
            console.log(`🚀 Keypoints processing disabled for video ${videoId}`);
            
            // Mock successful response without actually processing keypoints
            if (onProgress) {
                onProgress({
                    current: 1,
                    total: 1,
                    status: 'Keypoints processing disabled',
                    completed: true
                });
            }

            return {
                processedSuccessfully: 0,
                totalSegments: 0,
                results: [],
                message: 'Keypoints processing has been disabled'
            };

        } catch (error) {
            console.error('❌ Error processing video keypoints:', error);
            throw error;
        }
    }

    // ดึงข้อมูล segments ของวิดีโอ
    async getVideoSegments(videoId) {
        const response = await fetch(`${this.baseURL}/keypoints/videos/${videoId}/segments`);
        
        if (!response.ok) {
            throw new Error(`Failed to get video segments: ${response.status}`);
        }
        
        return await response.json();
    }

    // Extract keypoints สำหรับ segment เฉพาะ
    async extractSegmentKeypoints(videoId, segmentId) {
        const response = await fetch(`${this.baseURL}/keypoints/extract-segment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                video_id: videoId,
                segment_id: segmentId
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        return await response.json();
    }

    // ตรวจสอบสถานะ keypoints ของวิดีโอ
    async checkKeypointsStatus(videoId) {
        try {
            const segments = await this.getVideoSegments(videoId);
            
            const status = {
                totalSegments: segments.segments.length,
                withKeypoints: segments.segments.filter(s => s.has_keypoints).length,
                withoutKeypoints: segments.segments.filter(s => !s.has_keypoints).length,
                segments: segments.segments.map(s => ({
                    segmentId: s.segment_id,
                    exerciseId: s.exercise_id,
                    startTime: s.start_time,
                    endTime: s.end_time,
                    hasKeypoints: s.has_keypoints,
                    keypointsFile: s.keypoints_file
                }))
            };

            return status;

        } catch (error) {
            console.error('Error checking keypoints status:', error);
            throw error;
        }
    }

    // ลบ keypoints ของ segment
    async deleteSegmentKeypoints(videoId, segmentId) {
        const response = await fetch(`${this.baseURL}/keypoints/videos/${videoId}/segments/${segmentId}/keypoints`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Failed to delete keypoints: ${response.status}`);
        }

        return await response.json();
    }
}

export default KeypointsProcessor;