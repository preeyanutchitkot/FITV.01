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

    // 🎯 Core Function: เปรียบเทียบ keypoints ระหว่าง trainer และ trainee
    calculatePoseAccuracy(trainerPose, traineePose) {
        if (!trainerPose || !traineePose || 
            trainerPose.length !== traineePose.length) {
            return 0;
        }

        // กรองเฉพาะจุดที่มี visibility > 0.5
        const validPairs = [];
        for (let i = 0; i < trainerPose.length; i++) {
            if (trainerPose[i].visibility > 0.5 && traineePose[i].visibility > 0.5) {
                validPairs.push({ trainer: trainerPose[i], trainee: traineePose[i] });
            }
        }

        if (validPairs.length === 0) return 0;

        // วิธีที่ 1: Cosine Similarity
        const cosineSim = this.calculateCosineSimilarity(trainerPose, traineePose);
        
        // วิธีที่ 2: Angle Similarity (สำหรับข้อต่อสำคัญ)
        const angleSim = this.calculateAngleSimilarity(trainerPose, traineePose);
        
        // รวมคะแนนทั้งสองวิธี (60% angle + 40% cosine)
        const finalScore = Math.round(angleSim * 0.6 + cosineSim * 0.4);
        
        return Math.max(0, Math.min(100, finalScore));
    }

    // คำนวณ Cosine Similarity
    calculateCosineSimilarity(trainerPose, traineePose) {
        const flatten = (pose) => pose.flatMap(p => [p.x, p.y]);
        const trainerVector = flatten(trainerPose);
        const traineeVector = flatten(traineePose);

        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < trainerVector.length; i++) {
            dot += trainerVector[i] * traineeVector[i];
            normA += trainerVector[i] ** 2;
            normB += traineeVector[i] ** 2;
        }

        const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB));
        return Math.round(similarity * 100);
    }

    // คำนวณ Angle Similarity สำหรับข้อต่อสำคัญ
    calculateAngleSimilarity(trainerPose, traineePose) {
        // จุดข้อต่อสำคัญ [จุดที่1, จุดกลาง, จุดที่3]
        const joints = [
            [11, 13, 15], // แขนซ้าย (ไหล่-ศอก-ข้อมือ)
            [12, 14, 16], // แขนขวา (ไหล่-ศอก-ข้อมือ)
            [23, 25, 27], // ขาซ้าย (สะโพก-เข่า-ข้อเท้า)
            [24, 26, 28], // ขาขวา (สะโพก-เข่า-ข้อเท้า)
            [11, 23, 25], // ลำตัวซ้าย (ไหล่-สะโพก-เข่า)
            [12, 24, 26], // ลำตัวขวา (ไหล่-สะโพก-เข่า)
        ];

        let totalDiff = 0;
        let validJoints = 0;

        joints.forEach(([a, b, c]) => {
            if (this.isValidJoint(trainerPose, a, b, c) && 
                this.isValidJoint(traineePose, a, b, c)) {
                
                const trainerAngle = this.calculateAngle(
                    trainerPose[a], trainerPose[b], trainerPose[c]
                );
                const traineeAngle = this.calculateAngle(
                    traineePose[a], traineePose[b], traineePose[c]
                );
                
                const angleDiff = Math.abs(trainerAngle - traineeAngle);
                totalDiff += Math.min(angleDiff, 180 - angleDiff); // ใช้มุมที่เล็กกว่า
                validJoints++;
            }
        });

        if (validJoints === 0) return 0;

        const avgDiff = totalDiff / validJoints;
        // แปลงผลต่างมุมเป็นคะแนน (มุมต่าง 0° = 100%, มุมต่าง 45° = 0%)
        const score = Math.max(0, 100 - (avgDiff * 100 / 45));
        return Math.round(score);
    }

    // คำนวณมุมระหว่าง 3 จุด
    calculateAngle(p1, p2, p3) {
        const a = Math.hypot(p2.x - p3.x, p2.y - p3.y);
        const b = Math.hypot(p1.x - p3.x, p1.y - p3.y);
        const c = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        
        const angle = Math.acos((b ** 2 + c ** 2 - a ** 2) / (2 * b * c));
        return angle * (180 / Math.PI);
    }

    // ตรวจสอบว่าข้อต่อมี visibility ดีพอหรือไม่
    isValidJoint(pose, a, b, c) {
        return pose[a]?.visibility > 0.5 && 
               pose[b]?.visibility > 0.5 && 
               pose[c]?.visibility > 0.5;
    }

    // สร้าง feedback ตามคะแนน - 3 ระดับสี
    generateFeedback(accuracy) {
        if (accuracy > 70) {
            // 🟢 เขียว - ท่าดีมาก ถูกต้อง
            return {
                level: "excellent",
                message: "Excellent! ✅ ท่าดีมาก เยี่ยมเลย!",
                color: "#22c55e", // เขียวมะนาว
                bgColor: "rgba(34, 197, 94, 0.1)"
            };
        } else if (accuracy > 50) {
            // 🟡 เหลือง - พอใช้ได้ ต้องปรับเล็กน้อย
            return {
                level: "almost-there",
                message: "Almost There! ⚠️ เกือบดีแล้ว รักษาทรงอีกนิด",
                color: "#eab308", // เหลืองทอง
                bgColor: "rgba(234, 179, 8, 0.1)"
            };
        } else {
            // 🔴 แดง - ท่าผิดมาก ต้องปรับเยอะ
            return {
                level: "needs-adjustment",
                message: "Incorrect Posture ❌ ลองปรับท่าอีกหน่อยนะ",
                color: "#ef4444", // แดงสด
                bgColor: "rgba(239, 68, 68, 0.1)"
            };
        }
    }

    // คำนวณคะแนนเฉลี่ยสำหรับ session
    calculateSessionScore(accuracyHistory) {
        if (!accuracyHistory || accuracyHistory.length === 0) return 0;
        
        const sum = accuracyHistory.reduce((acc, val) => acc + val, 0);
        return Math.round(sum / accuracyHistory.length);
    }

    // วิเคราะห์จุดที่ต้องปรับปรุง
    analyzeWeakPoints(trainerPose, traineePose) {
        const joints = {
            'Left Arm': [11, 13, 15],
            'Right Arm': [12, 14, 16],
            'Left Leg': [23, 25, 27],
            'Right Leg': [24, 26, 28],
            'Core': [11, 23, 24]
        };

        const analysis = {};
        
        Object.entries(joints).forEach(([jointName, [a, b, c]]) => {
            if (this.isValidJoint(trainerPose, a, b, c) && 
                this.isValidJoint(traineePose, a, b, c)) {
                
                const trainerAngle = this.calculateAngle(
                    trainerPose[a], trainerPose[b], trainerPose[c]
                );
                const traineeAngle = this.calculateAngle(
                    traineePose[a], traineePose[b], traineePose[c]
                );
                
                const diff = Math.abs(trainerAngle - traineeAngle);
                analysis[jointName] = {
                    accuracy: Math.max(0, 100 - (diff * 100 / 45)),
                    needsImprovement: diff > 15
                };
            }
        });

        return analysis;
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