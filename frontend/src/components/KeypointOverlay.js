import React, { useRef, useEffect, useState } from 'react';

const KeypointOverlay = ({ videoRef, isPlaying, onKeypointsDetected, mirrorKeypoints = false }) => {
  const canvasRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pose, setPose] = useState(null);

  // MediaPipe Pose connections (33 landmarks)
  const POSE_CONNECTIONS = [
    // Face
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
    // Arms
    [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
    [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
    // Body
    [11, 23], [12, 24], [23, 24],
    // Legs
    [23, 25], [24, 26], [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
  ];

  useEffect(() => {
    const initializeMediaPipe = async () => {
      // Store original console.warn at the start
      const originalConsoleWarn = console.warn;
      
      try {
        console.log('Initializing MediaPipe Pose...');
        
        // Suppress CORS warnings for MediaPipe
        console.warn = (...args) => {
          if (args[0] && args[0].includes('Cross-Origin-Opener-Policy')) {
            return; // Skip CORS warnings
          }
          originalConsoleWarn.apply(console, args);
        };
        
        // โหลด MediaPipe จาก CDN
        if (!window.Pose) {
          // โหลด scripts จาก CDN
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js');
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
        }

        const poseInstance = new window.Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          }
        });

        poseInstance.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        poseInstance.onResults(onResults);
        setPose(poseInstance);
        setIsInitialized(true);
        
        // Restore console.warn after initialization
        setTimeout(() => {
          console.warn = originalConsoleWarn;
        }, 2000);
        
        console.log('MediaPipe Pose initialized successfully');
      } catch (error) {
        console.error('Failed to load MediaPipe:', error);
        console.log('MediaPipe initialization failed, will continue without pose detection');
        setIsInitialized(false);
        
        // Restore console.warn even if failed
        setTimeout(() => {
          console.warn = originalConsoleWarn;
        }, 100);
      }
    };

    // Add small delay to ensure video is ready
    const timer = setTimeout(initializeMediaPipe, 500);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (pose) {
        pose.close();
      }
    };
  }, [pose]);

  // Helper function to load scripts
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    if (!isInitialized || !pose || !videoRef?.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const processFrame = async () => {
      if (video.paused || video.ended || !isPlaying) return;
      
      try {
        // Match canvas size to video element's display size exactly
        const rect = video.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }
        
        // Send frame to MediaPipe with error handling
        if (pose && typeof pose.send === 'function') {
          await pose.send({ image: video });
        }
      } catch (error) {
        // Silently handle MediaPipe errors to prevent console spam
        if (!error.message.includes('Cross-Origin-Opener-Policy')) {
          console.error('Pose detection error:', error.message);
        }
      }

      if (isPlaying && !video.paused && !video.ended) {
        requestAnimationFrame(processFrame);
      }
    };

    if (isPlaying) {
      if (video.readyState >= 2) {
        processFrame();
      } else {
        video.addEventListener('loadeddata', processFrame, { once: true });
      }
    }

    // Clean up canvas when not playing
    if (!isPlaying) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [isPlaying, isInitialized, pose]);

  const onResults = (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !results.poseLandmarks) return;

    try {
      drawPoseMediaPipe(results.poseLandmarks, canvas, video);
      
      if (onKeypointsDetected) {
        if (mirrorKeypoints) {
          // Mirror the keypoints for workout comparison (flip x coordinates)
          const mirroredKeypoints = results.poseLandmarks.map(landmark => ({
            ...landmark,
            x: 1 - landmark.x  // Flip x coordinate to match mirrored display
          }));
          onKeypointsDetected(mirroredKeypoints);
        } else {
          // Use original keypoints without mirroring
          onKeypointsDetected(results.poseLandmarks);
        }
      }
    } catch (error) {
      console.error('Drawing error:', error);
    }
  };

  const drawPoseMediaPipe = (landmarks, canvas, video) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get actual video dimensions and display dimensions
    const videoRect = video.getBoundingClientRect();
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const displayWidth = videoRect.width;
    const displayHeight = videoRect.height;

    // Calculate aspect ratios
    const videoAspect = videoWidth / videoHeight;
    const displayAspect = displayWidth / displayHeight;

    // Calculate actual video display area within the video element
    let actualVideoWidth, actualVideoHeight, offsetX = 0, offsetY = 0;

    if (videoAspect > displayAspect) {
      // Video is wider - letterboxed top/bottom
      actualVideoWidth = displayWidth;
      actualVideoHeight = displayWidth / videoAspect;
      offsetY = (displayHeight - actualVideoHeight) / 2;
    } else {
      // Video is taller - letterboxed left/right
      actualVideoHeight = displayHeight;
      actualVideoWidth = displayHeight * videoAspect;
      offsetX = (displayWidth - actualVideoWidth) / 2;
    }

    // MediaPipe landmarks are normalized (0-1), scale to actual video area
    const scaleX = actualVideoWidth;
    const scaleY = actualVideoHeight;

    // Draw skeleton connections (with mirrored x coordinates)
    POSE_CONNECTIONS.forEach(([i, j]) => {
      const kp1 = landmarks[i];
      const kp2 = landmarks[j];
      
      // Only draw connections between high-confidence keypoints
      if (kp1 && kp2 && kp1.visibility > 0.7 && kp2.visibility > 0.7) {
        ctx.beginPath();
        ctx.moveTo(
          mirrorKeypoints ? (1 - kp1.x) * scaleX + offsetX : kp1.x * scaleX + offsetX,
          kp1.y * scaleY + offsetY
        );
        ctx.lineTo(
          mirrorKeypoints ? (1 - kp2.x) * scaleX + offsetX : kp2.x * scaleX + offsetX,
          kp2.y * scaleY + offsetY
        );
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw keypoints with different colors (with mirrored x coordinates)
    landmarks.forEach((landmark, index) => {
      // Only show keypoints with high confidence
      if (landmark && landmark.visibility > 0.7) {
        ctx.beginPath();
        ctx.arc(
          mirrorKeypoints ? (1 - landmark.x) * scaleX + offsetX : landmark.x * scaleX + offsetX,
          landmark.y * scaleY + offsetY,
          3,
          0,
          2 * Math.PI
        );
        
        // Different colors for different body parts
        if (index <= 10) {
          ctx.fillStyle = '#FF6B6B'; // Face and upper body
        } else if (index <= 16) {
          ctx.fillStyle = '#4ECDC4'; // Arms
        } else if (index <= 22) {
          ctx.fillStyle = '#45B7D1'; // Hands
        } else {
          ctx.fillStyle = '#96CEB4'; // Legs and body
        }
        
        ctx.fill();
        
        // No white border - just colored keypoints
      }
    });
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10
      }}
    />
  );
};

export default KeypointOverlay;