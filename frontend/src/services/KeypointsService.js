// KeypointsService.js - Service สำหรับจัดการ keypoints API

class KeypointsService {
    constructor(baseURL = 'http://localhost:8000') {
        this.baseURL = baseURL;
    }

    // อัพโหลด keypoints สำหรับ video segment
    async uploadKeypoints(videoId, segmentId, keypointsData) {
        try {
            const response = await fetch(
                `${this.baseURL}/keypoints/videos/${videoId}/segments/${segmentId}/upload`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        keypoints_data: keypointsData
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error uploading keypoints:', error);
            throw error;
        }
    }

    // โหลด keypoints สำหรับ video segment
    async loadKeypoints(videoId, segmentId) {
        try {
            const response = await fetch(
                `${this.baseURL}/keypoints/videos/${videoId}/segments/${segmentId}/load`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error loading keypoints:', error);
            throw error;
        }
    }

    // เปรียบเทียบ keypoints
    async compareKeypoints(videoId, segmentId, traineeKeypoints, timestamp) {
        try {
            const response = await fetch(
                `${this.baseURL}/keypoints/videos/${videoId}/segments/${segmentId}/compare`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        keypoints: traineeKeypoints,
                        timestamp: timestamp
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error comparing keypoints:', error);
            throw error;
        }
    }

    // ดูข้อมูล segments ทั้งหมดของ video
    async getVideoSegments(videoId) {
        try {
            const response = await fetch(
                `${this.baseURL}/keypoints/videos/${videoId}/segments`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting video segments:', error);
            throw error;
        }
    }

    // ลบ keypoints
    async deleteKeypoints(videoId, segmentId) {
        try {
            const response = await fetch(
                `${this.baseURL}/keypoints/videos/${videoId}/segments/${segmentId}/keypoints`,
                {
                    method: 'DELETE'
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting keypoints:', error);
            throw error;
        }
    }
}

// MediaPipe integration สำหรับ real-time pose detection
class PoseDetector {
    constructor() {
        this.pose = null;
        this.camera = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Import MediaPipe (ใช้ CDN หรือ npm install @mediapipe/pose)
            const { Pose } = await import('@mediapipe/pose');
            const { Camera } = await import('@mediapipe/camera_utils');

            this.pose = new Pose({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                }
            });

            this.pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.pose.onResults(this.onResults.bind(this));
            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing pose detector:', error);
            throw error;
        }
    }

    async startCamera(videoElement, onPoseDetected) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        this.onPoseDetected = onPoseDetected;

        try {
            this.camera = new Camera(videoElement, {
                onFrame: async () => {
                    await this.pose.send({ image: videoElement });
                },
                width: 640,
                height: 480
            });

            await this.camera.start();
        } catch (error) {
            console.error('Error starting camera:', error);
            throw error;
        }
    }

    onResults(results) {
        if (results.poseLandmarks && this.onPoseDetected) {
            // Convert MediaPipe landmarks to our format
            const keypoints = results.poseLandmarks.map(landmark => ({
                x: landmark.x,
                y: landmark.y,
                z: landmark.z,
                visibility: landmark.visibility
            }));

            this.onPoseDetected(keypoints);
        }
    }

    stop() {
        if (this.camera) {
            this.camera.stop();
        }
    }
}

// React Component ตัวอย่าง
const WorkoutComparison = ({ videoId, segmentId }) => {
    const [keypointsService] = useState(new KeypointsService());
    const [poseDetector] = useState(new PoseDetector());
    const [currentScore, setCurrentScore] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isComparing, setIsComparing] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        // เริ่มต้น camera และ pose detection
        const initializePoseDetection = async () => {
            try {
                await poseDetector.startCamera(
                    videoRef.current,
                    handlePoseDetected
                );
            } catch (error) {
                console.error('Failed to initialize pose detection:', error);
            }
        };

        initializePoseDetection();

        return () => {
            poseDetector.stop();
        };
    }, []);

    const handlePoseDetected = async (keypoints) => {
        if (!isComparing) return;

        try {
            // ใช้เวลาปัจจุบันของวิดีโอ trainer
            const currentTime = getCurrentTrainerVideoTime();
            
            // เปรียบเทียบกับ trainer keypoints
            const result = await keypointsService.compareKeypoints(
                videoId,
                segmentId,
                keypoints,
                currentTime
            );

            setCurrentScore(result.similarity_score);
            setFeedback(result.feedback);

            // แสดงผลบนหน้าจอ
            displayComparisonResult(result);

        } catch (error) {
            console.error('Error during pose comparison:', error);
        }
    };

    const startComparison = () => {
        setIsComparing(true);
    };

    const stopComparison = () => {
        setIsComparing(false);
    };

    const displayComparisonResult = (result) => {
        // แสดงผลคะแนนและ feedback บนหน้าจอ
        // สามารถเพิ่ม visual feedback เช่น สีเขียว/แดง สำหรับท่าถูก/ผิด
        console.log('Comparison result:', result);
    };

    const getCurrentTrainerVideoTime = () => {
        // ดึงเวลาปัจจุบันจากวิดีโอ trainer ที่กำลังเล่น
        // ต้องเชื่อมต่อกับ video player component
        return 0; // placeholder
    };

    return (
        <div className="workout-comparison">
            <div className="video-container">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="trainee-video"
                />
                <canvas
                    ref={canvasRef}
                    className="pose-overlay"
                />
            </div>
            
            <div className="comparison-controls">
                <button 
                    onClick={startComparison}
                    disabled={isComparing}
                    className="btn-start"
                >
                    Start Comparison
                </button>
                <button 
                    onClick={stopComparison}
                    disabled={!isComparing}
                    className="btn-stop"
                >
                    Stop Comparison
                </button>
            </div>

            <div className="feedback-panel">
                <div className="score-display">
                    <h3>Score: {(currentScore * 100).toFixed(1)}%</h3>
                </div>
                <div className="feedback-text">
                    <p>{feedback}</p>
                </div>
            </div>
        </div>
    );
};

export { KeypointsService, PoseDetector, WorkoutComparison };