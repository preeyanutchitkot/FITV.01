import React, { useRef, useEffect, useState } from "react";
import PoseComparator from "../utils/PoseComparator";

export default function RealtimeTrainer() {
  const [accuracy, setAccuracy] = useState(0);
  const [feedbacks, setFeedbacks] = useState([]);
  const [aiFeedback, setAiFeedback] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [started, setStarted] = useState(false);
  const trainerKeypointsRef = useRef();
  const traineeKeypointsRef = useRef();
  const aiFeedbackTimer = useRef(null);

  // Countdown 5 วินาทีก่อนเริ่ม
  useEffect(() => {
    if (countdown > 0 && !started) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !started) {
      setStarted(true);
    }
  }, [countdown, started]);

  // TODO: integrate MediaPipe or keypoint detection for both trainer and trainee

  useEffect(() => {
    if (!started) return;
    const interval = setInterval(async () => {
      const trainerPose = trainerKeypointsRef.current;
      const traineePose = traineeKeypointsRef.current;
      if (trainerPose && traineePose) {
        const result = PoseComparator.compare(trainerPose, traineePose);
        setAccuracy(result.accuracy);
        setFeedbacks(result.recommendations);
        // เรียก AI feedback ทุก 2 วินาที (ลด call ซ้ำ)
        if (!aiFeedbackTimer.current) {
          aiFeedbackTimer.current = setTimeout(async () => {
            aiFeedbackTimer.current = null;
            try {
              const res = await fetch("http://localhost:8000/ai-feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  accuracy: result.accuracy,
                  bodyPartScores: result.bodyPartScores,
                  recommendations: result.recommendations,
                }),
              });
              const data = await res.json();
              console.log("AI feedback:", data);
              setAiFeedback(data.ai_feedback);
            } catch (e) {
              setAiFeedback("");
            }
          }, 2000);
        }
      }
    }, 500); // ทุก 0.5 วินาที
    return () => clearInterval(interval);
  }, [started]);

  return (
    <div>
      {!started && (
        <div
          style={{
            position: "fixed",
            top: 120,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#222",
            color: "#fff",
            padding: "32px 48px",
            borderRadius: 24,
            fontSize: 48,
            zIndex: 9999,
            fontWeight: 700,
            boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
            textAlign: "center",
          }}
        >
          {countdown > 0 ? countdown : "เริ่ม!"}
        </div>
      )}
      <div>Accuracy: {accuracy}%</div>
      <div>
        {feedbacks.map((f, i) => (
          <div key={i}>
            {f.bodyPart}: {f.issue}
          </div>
        ))}
      </div>
      {aiFeedback && (
        <div
          className="ai-comment"
          style={{
            position: "fixed",
            top: 90,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.85)",
            color: "#fff",
            padding: "16px 32px",
            borderRadius: 16,
            fontSize: 22,
            zIndex: 9999,
            boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
            maxWidth: 480,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          🤖 {aiFeedback}
        </div>
      )}
      {/* TODO: video, webcam, UI, keypoint overlay */}
    </div>
  );
}
