import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import KeypointOverlay from '../components/KeypointOverlay';
import { multiDirectionalPoseComparator } from '../utils/MultiDirectionalPoseComparator';
import './WorkoutPage.css';
import '../components/Dashboard.css';

const WorkoutPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  
  // Refs for video and camera
  const trainerVideoRef = useRef(null);
  const traineeVideoRef = useRef(null);
  const traineeCanvasRef = useRef(null);
  
  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [waitingToPlay, setWaitingToPlay] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [segments, setSegments] = useState([]);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Camera and keypoints states
  const [cameraStream, setCameraStream] = useState(null);
  const [traineeKeypoints, setTraineeKeypoints] = useState(null);
  const [trainerKeypoints, setTrainerKeypoints] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  
  // Scoring states - Multi-Directional Analysis
  const [matchScore, setMatchScore] = useState(0);
  const [feedback, setFeedback] = useState('เริ่มต้นออกกำลังกาย');
  const [isInitialized, setIsInitialized] = useState(false);
  const [bodyPartScores, setBodyPartScores] = useState({});
  const [jointComparisons, setJointComparisons] = useState({});
  const [trainerDirection, setTrainerDirection] = useState('UNKNOWN');
  const [traineeDirection, setTraineeDirection] = useState('UNKNOWN');
  const [confidenceLevel, setConfidenceLevel] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  // AI feedback state
  const [aiFeedback, setAiFeedback] = useState("");
  const aiFeedbackTimer = useRef(null);
  
  // Session tracking
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionScores, setSessionScores] = useState([]);

  // Load video data and segments
  useEffect(() => {
    const loadVideoData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/videos/${videoId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to load video');
        
        const data = await response.json();
        console.log('📺 Video data loaded:', data);
        setVideoData(data);
        
        // Reset playing state when new video loads
        setIsPlaying(false);
        
        // Load segments
        const segmentsResponse = await fetch(`http://localhost:8000/videos/${videoId}/segments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (segmentsResponse.ok) {
          const segmentsData = await segmentsResponse.json();
          setSegments(segmentsData.segments || []);
        }
        
      } catch (error) {
        console.error('Error loading video data:', error);
        alert('ไม่สามารถโหลดข้อมูลวิดีโอได้');
        navigate('/trainee');
      } finally {
        setLoading(false);
      }
    };
    
    loadVideoData();
  }, [videoId, navigate]);

  // Camera permission states  
  const [cameraPermissionState, setCameraPermissionState] = useState('not-requested'); // 'not-requested', 'requesting', 'granted', 'denied'
  const [userRequestedCamera, setUserRequestedCamera] = useState(false);

  // Debug log for states
  useEffect(() => {
    console.log('WorkoutPage State:', {
      userRequestedCamera,
      cameraPermissionState,
      cameraStream: !!cameraStream,
      cameraError,
      isInitialized
    });
  }, [userRequestedCamera, cameraPermissionState, cameraStream, cameraError, isInitialized]);

  // Request camera permission function
  const requestCameraPermission = useCallback(async () => {
    console.log('🎥 requestCameraPermission called');
    setCameraPermissionState('requesting');
    setUserRequestedCamera(true);
    
    try {
      console.log('กำลังขออนุญาตใช้กล้อง...');
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser ไม่รองรับการเข้าถึงกล้อง');
      }
      
      const constraints = {
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 }, 
          facingMode: 'user'
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('เปิดกล้องสำเร็จ:', stream);
      
      setCameraStream(stream);
      setCameraPermissionState('granted');
      setCameraError(null);
      
      console.log('✅ Camera stream state updated');
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'ไม่สามารถเข้าถึงกล้องได้';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'กรุณาอนุญาตการใช้งานกล้องในเบราว์เซอร์';
        setCameraPermissionState('denied');
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'ไม่พบกล้องในอุปกรณ์';
        setCameraPermissionState('denied');
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'กล้องถูกใช้งานโดยแอปพลิเคชันอื่น';
        setCameraPermissionState('denied');
      } else {
        setCameraPermissionState('denied');
      }
      
      setCameraError(errorMessage);
      setIsInitialized(false);
    }
  }, []);

  // Handle camera stream assignment to video element
  useEffect(() => {
    if (cameraStream && traineeVideoRef.current) {
      console.log('🎯 Assigning camera stream to video element');
      const videoElement = traineeVideoRef.current;
      
      // Clear any existing stream first
      if (videoElement.srcObject) {
        const existingStream = videoElement.srcObject;
        if (existingStream !== cameraStream) {
          existingStream.getTracks().forEach(track => track.stop());
        }
      }
      
      // Assign new stream
      videoElement.srcObject = cameraStream;
      
      // Force play
      videoElement.play().then(() => {
        console.log('✅ Video playing successfully');
        setIsInitialized(true);
      }).catch(err => {
        console.error('❌ Error playing video:', err);
      });
    }
  }, [cameraStream]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Handle play/pause with error handling
  const togglePlayPause = async () => {
    if (isPlaying) {
      trainerVideoRef.current.pause();
      setIsPlaying(false);
      setCountdown(0);
      setWaitingToPlay(false);
    } else {
      setCountdown(5);
      setWaitingToPlay(true);
    }
  };

  // Countdown effect: เมื่อ countdown ถึง 0 ให้เล่นวิดีโอ
  useEffect(() => {
    if (waitingToPlay && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (waitingToPlay && countdown === 0) {
      // เริ่มเล่นวิดีโอ
      if (trainerVideoRef.current) {
        trainerVideoRef.current.play();
        setIsPlaying(true);
        setWaitingToPlay(false);
      }
    }
  }, [waitingToPlay, countdown]);

  // Handle trainer keypoints detection (from video processing)
  const handleTrainerKeypoints = (keypoints) => {
    console.log('🎬 Trainer keypoints detected:', keypoints?.length || 0, 'points');
    setTrainerKeypoints(keypoints);
  };

  // 🎬 Load sample trainer keypoints สำหรับทดสอบ
  useEffect(() => {
    // โหลด keypoints ทันทีเมื่อ component mount (ไม่ต้องรอ video เล่น)
    const loadTrainerKeypoints = () => {
      console.log('🎬 Loading default trainer keypoints for testing...');
      
      // สร้าง keypoints แบบ squat pose
      const squatKeypoints = [
        // Nose
        { x: 0.5, y: 0.2, z: 0, visibility: 0.9 },
        // Left/Right Eye Inner
        { x: 0.48, y: 0.18, z: 0, visibility: 0.9 },
        { x: 0.52, y: 0.18, z: 0, visibility: 0.9 },
        // Left/Right Eye
        { x: 0.47, y: 0.18, z: 0, visibility: 0.9 },
        { x: 0.53, y: 0.18, z: 0, visibility: 0.9 },
        // Left/Right Eye Outer
        { x: 0.46, y: 0.18, z: 0, visibility: 0.9 },
        { x: 0.54, y: 0.18, z: 0, visibility: 0.9 },
        // Left/Right Ear
        { x: 0.45, y: 0.2, z: 0, visibility: 0.9 },
        { x: 0.55, y: 0.2, z: 0, visibility: 0.9 },
        // Mouth Left/Right
        { x: 0.48, y: 0.22, z: 0, visibility: 0.9 },
        { x: 0.52, y: 0.22, z: 0, visibility: 0.9 },
        // Left Shoulder
        { x: 0.4, y: 0.35, z: 0, visibility: 0.9 },
        // Right Shoulder
        { x: 0.6, y: 0.35, z: 0, visibility: 0.9 },
        // Left Elbow
        { x: 0.35, y: 0.5, z: 0, visibility: 0.9 },
        // Right Elbow
        { x: 0.65, y: 0.5, z: 0, visibility: 0.9 },
        // Left Wrist
        { x: 0.3, y: 0.65, z: 0, visibility: 0.9 },
        // Right Wrist
        { x: 0.7, y: 0.65, z: 0, visibility: 0.9 },
        // Left Pinky
        { x: 0.28, y: 0.67, z: 0, visibility: 0.8 },
        // Right Pinky
        { x: 0.72, y: 0.67, z: 0, visibility: 0.8 },
        // Left Index
        { x: 0.32, y: 0.67, z: 0, visibility: 0.8 },
        // Right Index
        { x: 0.68, y: 0.67, z: 0, visibility: 0.8 },
        // Left Thumb
        { x: 0.29, y: 0.64, z: 0, visibility: 0.8 },
        // Right Thumb
        { x: 0.71, y: 0.64, z: 0, visibility: 0.8 },
        // Left Hip
        { x: 0.45, y: 0.7, z: 0, visibility: 0.9 },
        // Right Hip
        { x: 0.55, y: 0.7, z: 0, visibility: 0.9 },
        // Left Knee (squat position - bent)
        { x: 0.42, y: 0.85, z: 0, visibility: 0.9 },
        // Right Knee (squat position - bent)
        { x: 0.58, y: 0.85, z: 0, visibility: 0.9 },
        // Left Ankle
        { x: 0.4, y: 0.95, z: 0, visibility: 0.9 },
        // Right Ankle
        { x: 0.6, y: 0.95, z: 0, visibility: 0.9 },
        // Left Heel
        { x: 0.38, y: 0.97, z: 0, visibility: 0.8 },
        // Right Heel
        { x: 0.62, y: 0.97, z: 0, visibility: 0.8 },
        // Left Foot Index
        { x: 0.42, y: 0.97, z: 0, visibility: 0.8 },
        // Right Foot Index
        { x: 0.58, y: 0.97, z: 0, visibility: 0.8 }
      ];

      handleTrainerKeypoints(squatKeypoints);
    };

    // โหลด keypoints ทันทีเมื่อ component mount
    loadTrainerKeypoints();
  }, []); // Empty dependency array = run once on mount

  // Log สำหรับ debug เมื่อวิดีโอเล่น
  useEffect(() => {
    if (isPlaying) {
      console.log('🎬 Video is now playing, trainer keypoints should be available');
    }
  }, [isPlaying]);

  // Handle trainee keypoints detection (real-time from camera)
  const handleTraineeKeypoints = (keypoints) => {
    // ...existing code...
    setTraineeKeypoints(keypoints);
    if (trainerKeypoints && keypoints) {
      const importantIndices = [11, 12, 23, 24, 25, 26];
      const allVisible = importantIndices.every(idx => keypoints[idx]?.visibility > 0.6);
      if (!allVisible) {
        setMatchScore(0);
        setFeedback('โปรดอยู่ในกรอบกล้องและขยับให้ตรงกับวิดีโอ');
        return;
      }
      const analysis = multiDirectionalPoseComparator.compareMultiDirectional(
        trainerKeypoints,
        keypoints
      );
      setMatchScore(analysis.accuracy);
      setFeedback(analysis.feedback);
      setBodyPartScores(analysis.bodyPartScores);
      setJointComparisons(analysis.jointComparisons);
      setTrainerDirection(analysis.trainerDirection);
      setTraineeDirection(analysis.traineeDirection);
      setConfidenceLevel(analysis.confidence);
      setRecommendations(analysis.recommendations);
      trackSessionData(analysis);

      // เรียก AI feedback ทุก 2 วินาที (ลด call ซ้ำ)
      if (!aiFeedbackTimer.current) {
        aiFeedbackTimer.current = setTimeout(async () => {
          aiFeedbackTimer.current = null;
          try {
            const res = await fetch('http://localhost:8000/ai-feedback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accuracy: analysis.accuracy,
                bodyPartScores: analysis.bodyPartScores,
                recommendations: analysis.recommendations
              })
            });
            const data = await res.json();
            setAiFeedback(data.ai_feedback);
          } catch (e) {
            setAiFeedback('');
          }
        }, 2000);
      }
    }
  };

  // Track session performance data
  const trackSessionData = (analysis) => {
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
    }
    
    setSessionScores(prev => [...prev, {
      timestamp: Date.now(),
      accuracy: analysis.accuracy,
      confidence: analysis.confidence,
      bodyPartScores: analysis.bodyPartScores
    }]);
  };

  // 🚀 Old comparison algorithms replaced by Multi-Directional Pose Comparator
  // All pose analysis logic moved to utils/MultiDirectionalPoseComparator.js

  // State สำหรับสรุปผลคะแนน
  const [showSummary, setShowSummary] = useState(false);
  const [finalScore, setFinalScore] = useState(null);

  // เมื่อวิดีโอเล่นจบ (onEnded)
  const handleVideoEnded = () => {
    if (sessionScores.length > 0) {
      const avg = Math.round(sessionScores.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessionScores.length);
      setFinalScore(avg);
      setShowSummary(true);
    }
  };

  if (loading) {
    return (
      <div className="workout-loading">
        <div className="running-loader">
          <div className="runner">
            <div className="head"></div>
            <div className="torso"></div>
            <div className="arm arm-right"></div>
            <div className="arm arm-left"></div>
            <div className="leg leg-right"></div>
            <div className="leg leg-left"></div>
            <div className="shadow"></div>
          </div>
          <span className="runner-text">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="workout-page">
      {/* Countdown Floating Message */}
      {waitingToPlay && countdown > 0 && (
        <div style={{
          position: 'fixed',
          top: 120,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#222',
          color: '#fff',
          padding: '32px 48px',
          borderRadius: 24,
          fontSize: 48,
          zIndex: 9999,
          fontWeight: 700,
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          textAlign: 'center',
        }}>
          {countdown}
        </div>
      )}
      {/* AI Feedback Floating Message */}
      {/*
      {aiFeedback && (
        <div
          className="ai-comment"
          style={{
            position: "fixed",
            bottom: 40,
            left: 40,
            background: "rgba(0,0,0,0.85)",
            color: "#fff",
            padding: "16px 32px",
            borderRadius: 16,
            fontSize: 20,
            zIndex: 9999,
            boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
            maxWidth: 400,
            textAlign: "left",
            pointerEvents: "none",
          }}
        >
          <span role="img" aria-label="ai">🤖</span> {aiFeedback}
        </div>
      )}
      */}
      {/* Top Header with Exercise Info */}
      <div className="workout-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/trainee')}>
            ← กลับ
          </button>
          <h1 className="exercise-name">
            {segments.length > 0 ? segments[currentSegment]?.exercise_name || 'Chair-Assisted Squats' : 'Chair-Assisted Squats'}
          </h1>
        </div>
        
        <div className="header-center">
          <div className="feedback-status">Excellent!</div>
        </div>
        
        <div className="header-right">
          <div className="timer">0:22</div>
          <div className="rounds">
            {segments.length > 0 ? `${currentSegment + 1}/${segments.length}` : '9/15'}
          </div>
        </div>
      </div>

      {/* Main workout area */}
      <div className="workout-container">
        {/* Left: Trainee camera with keypoints */}
        <div className="trainee-panel">
          <div className="video-container trainee-container">
            {!userRequestedCamera ? (
              <div className="camera-permission-request">
                <div className="camera-icon">📷</div>
                <h3>เปิดกล้องเพื่อเริ่มออกกำลังกาย</h3>
                <p>ระบบจะใช้กล้องเพื่อตรวจจับท่าของคุณและให้คะแนน</p>
                <button 
                  className="enable-camera-btn"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    zIndex: 9999,
                    position: 'relative',
                    pointerEvents: 'auto'
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Button clicked!');
                    requestCameraPermission();
                  }}
                  onMouseDown={(e) => {
                    console.log('Button mouse down!');
                  }}
                  onTouchStart={(e) => {
                    console.log('Button touch start!');
                  }}
                >
                  🎥 เปิดกล้อง
                </button>
                <div className="camera-info">
                  <small>เราจะไม่บันทึกหรือส่งข้อมูลวิดีโอของคุณไปยังเซิร์ฟเวอร์</small>
                </div>
              </div>
            ) : cameraPermissionState === 'requesting' ? (
              <div className="camera-loading">
                <div className="loading-spinner">📷</div>
                <div>กำลังขออนุญาตใช้กล้อง...</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                  กรุณาอนุญาตการใช้งานกล้องในป๊อปอัป
                </div>
              </div>
            ) : cameraPermissionState === 'denied' || cameraError ? (
              <div className="camera-error">
                <div className="error-icon">❌</div>
                <div className="error-message">{cameraError || 'ไม่ได้รับอนุญาตใช้กล้อง'}</div>
                <div style={{ fontSize: '14px', color: '#666', margin: '10px 0' }}>
                  วิธีแก้ไข:
                  <ol style={{ textAlign: 'left', paddingLeft: '20px' }}>
                    <li>คลิก 🔒 หรือ 📷 ใกล้ URL บาร์</li>
                    <li>เลือก "อนุญาต" สำหรับกล้อง</li>
                    <li>รีเฟรชหน้าเว็บ</li>
                  </ol>
                </div>
                <button 
                  className="retry-btn"
                  onClick={() => window.location.reload()}
                >
                  รีเฟรชหน้า
                </button>
                <button 
                  className="retry-btn"
                  onClick={requestCameraPermission}
                  style={{ marginLeft: '10px', background: '#3b82f6' }}
                >
                  ลองอีกครั้ง
                </button>
              </div>
            ) : cameraStream ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                {console.log('🎬 Rendering video with stream:', !!cameraStream)}
                <video
                  ref={traineeVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="trainee-video"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    transform: 'scaleX(-1)'  // Mirror the video horizontally
                  }}
                  onLoadedMetadata={() => {
                    console.log('📹 Video metadata loaded');
                  }}
                  onCanPlay={() => {
                    console.log('📹 Video can play');
                  }}
                  onPlaying={() => {
                    console.log('📹 Video is playing');
                  }}
                  onError={(e) => {
                    console.error('📹 Video error:', e);
                  }}
                />
                {isInitialized && (
                  <KeypointOverlay
                    videoRef={traineeVideoRef}
                    isPlaying={true}
                    onKeypointsDetected={handleTraineeKeypoints}
                    mirrorKeypoints={true}
                  />
                )}
                <div className="section-label live-label">
                  <span className="live-indicator">🔴 LIVE</span>
                </div>
              </div>
            ) : (
              <div className="camera-loading">
                <div className="running-loader">
                  <div className="runner">
                    <div className="head"></div>
                    <div className="torso"></div>
                    <div className="arm arm-right"></div>
                    <div className="arm arm-left"></div>
                    <div className="leg leg-right"></div>
                    <div className="leg leg-left"></div>
                    <div className="shadow"></div>
                  </div>
                  <span className="runner-text">กำลังเปิดกล้อง...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Vertical Accuracy Bar */}
        <div className="accuracy-section">
          <div className="accuracy-bar-container">
            <div className="accuracy-bar">
              <div 
                className="accuracy-fill" 
                style={{ height: `${matchScore}%` }}
              ></div>
            </div>
            <div className="accuracy-percentage">
              {matchScore}%
            </div>
          </div>
        </div>

        {/* Right: Trainer video */}
        <div className="trainer-panel">
          <div className="video-container trainer-container">
            <video
              ref={trainerVideoRef}
              onEnded={handleVideoEnded}
              src={(() => {
                // Helper function to get video URL with CORS handling
                const getVideoUrl = (url) => {
                  if (!url) return 'http://localhost:8000/static/fitness%20app_V1-0007_480.mp4';
                  
                  // If it's a full HTTP/HTTPS URL (S3, external), use proxy
                  if (/^https?:\/\//i.test(url)) {
                    // Check if it's S3 or external URL that might have CORS issues
                    if (url.includes('s3.') || url.includes('amazonaws.com')) {
                      return `http://localhost:8000/video-proxy?url=${encodeURIComponent(url)}`;
                    }
                    return url; // Use direct URL for other sources
                  }
                  
                  // If it's a relative path, use static endpoint
                  return `http://localhost:8000/static/${encodeURIComponent(url.replace(/^.*[\\\/]/, ''))}`;
                };

                // Try different fields in order of preference
                return videoData?.s3_url 
                  ? getVideoUrl(videoData.s3_url)
                  : videoData?.image 
                    ? getVideoUrl(videoData.image)
                    : videoData?.video_url 
                      ? getVideoUrl(videoData.video_url)
                      : videoData?.file_path
                        ? getVideoUrl(videoData.file_path)
                        : 'http://localhost:8000/static/fitness%20app_V1-0007_480.mp4';
              })()}
              className="trainer-video"
              controls
              onPlay={() => {
                console.log('🎬 Video started playing');
                setIsPlaying(true);
              }}
              onPause={() => {
                console.log('⏸️ Video paused');
                setIsPlaying(false);
              }}
              onCanPlay={() => {
                console.log('🎬 Video ready to play');
              }}
              onLoadedData={() => {
                console.log('🎬 Video data loaded successfully');
              }}
              onError={(e) => {
                console.error('Trainer video error:', e);
                console.log('Video data:', videoData);
                console.log('Attempting to load video from URL:', e.target.src);
                setIsPlaying(false);
              }}
              onAbort={() => {
                console.log('🚫 Video loading aborted');
                setIsPlaying(false);
              }}
              onLoadStart={() => {
                console.log('Trainer video loading:', videoData?.s3_url || videoData?.image);
                const getVideoUrl = (url) => {
                  if (!url) return 'http://localhost:8000/static/fitness%20app_V1-0007_480.mp4';
                  
                  if (/^https?:\/\//i.test(url)) {
                    if (url.includes('s3.') || url.includes('amazonaws.com')) {
                      return `http://localhost:8000/video-proxy?url=${encodeURIComponent(url)}`;
                    }
                    return url;
                  }
                  
                  return `http://localhost:8000/static/${encodeURIComponent(url.replace(/^.*[\\\/]/, ''))}`;
                };

                const finalSrc = videoData?.s3_url 
                  ? getVideoUrl(videoData.s3_url)
                  : videoData?.image 
                    ? getVideoUrl(videoData.image)
                    : videoData?.video_url 
                      ? getVideoUrl(videoData.video_url)
                      : videoData?.file_path
                        ? getVideoUrl(videoData.file_path)
                        : 'http://localhost:8000/static/fitness%20app_V1-0007_480.mp4';
                        
                console.log('📺 Final video src:', finalSrc);
              }}
              crossOrigin="anonymous"
            />
            <div className="section-label playing-label">
              <span className="trainer-indicator">🎯 PLAYING</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bottom-controls">
        <button 
          className={`pause-btn ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlayPause}
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        {!userRequestedCamera && (
          <button 
            className="enable-camera-btn-bottom"
            onClick={requestCameraPermission}
            style={{
              marginLeft: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            � เปิดกล้องเพื่อเริ่มออกกำลังกาย
          </button>
        )}
      </div>

      {/* สรุปผลคะแนนหลังออกกำลังกาย */}
      {showSummary && (
        <div style={{
          position: 'fixed',
          left: '50%',
          bottom: 80,
          transform: 'translateX(-50%)',
          background: '#222',
          color: '#fff',
          padding: '32px 48px',
          borderRadius: 24,
          fontSize: 32,
          zIndex: 9999,
          fontWeight: 700,
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          textAlign: 'center',
        }}>
          <div>🎉 สรุปผลออกกำลังกาย</div>
          <div style={{ fontSize: 48, margin: '16px 0' }}>{finalScore ?? 0} คะแนน</div>
          <div style={{ fontSize: 20, marginBottom: 24 }}>
            {finalScore >= 80 ? 'เยี่ยมมาก! ท่าถูกต้องเกือบทั้งหมด' : finalScore >= 50 ? 'ดีแล้ว! ลองปรับท่าบางจุดให้แม่นยำขึ้น' : 'ฝึกอีกนิดนะ ลองดูวิดีโอตัวอย่างและขยับตามให้มากขึ้น'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <button
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 32px',
                fontSize: 22,
                fontWeight: 600,
                cursor: 'pointer',
                marginRight: 8
              }}
              onClick={async () => {
                // รีเซ็ต state ที่เกี่ยวข้องกับ session ใหม่
                setShowSummary(false);
                setFinalScore(null);
                setSessionScores([]);
                setCurrentSegment(0);
                setIsPlaying(false);
                setCountdown(5);
                setWaitingToPlay(true);
                setTraineeKeypoints(null);
                setTrainerKeypoints(null);
                setBodyPartScores({});
                setJointComparisons({});
                setTrainerDirection('UNKNOWN');
                setTraineeDirection('UNKNOWN');
                setConfidenceLevel(0);
                setRecommendations([]);
                setAiFeedback("");
                // รีเซ็ตวิดีโอไปจุดเริ่มต้น
                if (trainerVideoRef.current) {
                  trainerVideoRef.current.currentTime = 0;
                  trainerVideoRef.current.pause();
                }
                if (traineeVideoRef.current) {
                  traineeVideoRef.current.currentTime = 0;
                  traineeVideoRef.current.pause();
                }
                // รีสตาร์ทกล้องใหม่ (stop แล้ว start ใหม่)
                if (cameraStream) {
                  cameraStream.getTracks().forEach(track => track.stop());
                  setCameraStream(null);
                }
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                  setCameraStream(stream);
                } catch (err) {
                  setCameraError('ไม่สามารถเปิดกล้องได้');
                }
              }}
            >
              🔄 ทำใหม่
            </button>
            <button
              style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 32px',
                fontSize: 22,
                fontWeight: 600,
                cursor: 'pointer',
                marginLeft: 8
              }}
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  await fetch(`http://localhost:8000/trainee/score`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      video_id: videoId,
                      score: finalScore,
                      status: 'pass'
                    })
                  });
                } catch (e) {}
                setTimeout(() => {
                  navigate('/trainee');
                }, 500);
              }}
            >
              ✅ เสร็จสิ้น
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutPage;