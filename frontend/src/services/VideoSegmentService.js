// VideoSegmentService.js - Service สำหรับจัดการ video segments

class VideoSegmentService {
    constructor(baseURL = 'http://localhost:8000') {
        this.baseURL = baseURL;
    }

    // สร้าง segment ใหม่ (จะ trigger keypoints extraction อัตโนมัติ)
    async createSegment(videoId, segmentData) {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${this.baseURL}/videos/${videoId}/segments`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        exercise_id: segmentData.exerciseId,
                        start_time: segmentData.startTime,
                        end_time: segmentData.endTime
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Segment created successfully:', result);
            return result;

        } catch (error) {
            console.error('❌ Error creating segment:', error);
            throw error;
        }
    }

    // ดึงรายการ segments ทั้งหมดของ video
    async getVideoSegments(videoId) {
        try {
            const response = await fetch(
                `${this.baseURL}/videos/${videoId}/segments`
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('Error getting video segments:', error);
            throw error;
        }
    }

    // ลบ segment
    async deleteSegment(videoId, segmentId) {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${this.baseURL}/videos/${videoId}/segments/${segmentId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('Error deleting segment:', error);
            throw error;
        }
    }

    // ตรวจสอบสถานะ keypoints ของ segment - DISABLED
    async getKeypointsStatus(videoId, segmentId) {
        // Keypoints extraction disabled - return mock data
        return {
            has_keypoints: false,
            processing: false,
            frames_count: 0,
            keypoints_file: null
        };
    }

    // Poll สถานะ keypoints จนกว่าจะเสร็จ
    async waitForKeypointsCompletion(videoId, segmentId, onProgress = null, maxAttempts = 30) {
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            try {
                const status = await this.getKeypointsStatus(videoId, segmentId);
                
                if (onProgress) {
                    onProgress({
                        segmentId: segmentId,
                        hasKeypoints: status.has_keypoints,
                        processing: status.processing,
                        framesCount: status.frames_count,
                        attempt: attempts + 1,
                        maxAttempts: maxAttempts
                    });
                }

                // ถ้าประมวลผลเสร็จแล้ว
                if (status.has_keypoints && !status.processing) {
                    console.log(`✅ Keypoints ready for segment ${segmentId}`);
                    return status;
                }

                // ถ้ายังไม่เสร็จ รอ 2 วินาทีแล้วลองใหม่
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempts++;

            } catch (error) {
                console.error(`Error checking keypoints status (attempt ${attempts + 1}):`, error);
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        throw new Error(`Keypoints processing timeout for segment ${segmentId}`);
    }



    // Batch create segments (สร้างหลาย segments พร้อมกัน)
    async createMultipleSegments(videoId, segmentsData) {
        const results = [];

        for (const segmentData of segmentsData) {
            try {
                const result = await this.createSegment(videoId, segmentData);

                results.push({
                    success: true,
                    segmentData: segmentData,
                    result: result
                });

            } catch (error) {
                console.error(`❌ Failed to create segment:`, error);
                results.push({
                    success: false,
                    segmentData: segmentData,
                    error: error.message
                });
            }
        }

        return {
            total: segmentsData.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results: results
        };
    }
}

export default VideoSegmentService;