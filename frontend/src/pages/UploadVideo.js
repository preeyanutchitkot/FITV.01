// src/pages/UploadVideo.jsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TrainerHeader from "../components/TrainerHeader";
import KeypointOverlay from "../components/KeypointOverlay";
import VideoSegmentService from "../services/VideoSegmentService";

const box = (extra = {}) => ({
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  ...extra,
});

export default function UploadVideo() {
  // สถานะ loading เฉพาะปุ่ม save draft
  const [submittingDraft, setSubmittingDraft] = useState(false);
  
  // State สำหรับ keypoint overlay
  const videoRef = useRef(null);
  const [showKeypoints, setShowKeypoints] = useState(false);
  const [keypoints, setKeypoints] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [processingKeypoints, setProcessingKeypoints] = useState(false);
  const [allKeypoints, setAllKeypoints] = useState([]); // เก็บ keypoints ทั้งหมดของวิดีโอ
  
  // NEW: Time Picker States
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [exerciseSegments, setExerciseSegments] = useState([]);
  const [newSegment, setNewSegment] = useState({
    exerciseId: '',
    exerciseName: '',
    startTime: 0,
    endTime: 0,
    isSelectingStart: false,
    isSelectingEnd: false
  });
  
  // NEW: Available exercises from DB
  const [availableExercises, setAvailableExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  // NEW: Services (keeping for potential future use)
  const [videoSegmentService] = useState(new VideoSegmentService());
  
  // NEW: เก็บ video ID หลังจาก upload สำเร็จ
  const [videoId, setVideoId] = useState(null);

  // NEW: Fetch exercises from backend
  useEffect(() => {
    const fetchExercises = async () => {
      setLoadingExercises(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8000/exercises", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        if (res.ok) {
          const exercises = await res.json();
          console.log("✅ Exercises loaded from API:", exercises.length);
          setAvailableExercises(exercises);
        } else {
          console.warn("⚠️ API /exercises not available, using fallback data");
          // Fallback exercises ตรงกับข้อมูลใน DB
          setAvailableExercises([
            // Upper Body
            { id: 1, name: "Push-up", muscle_group: "Chest/Triceps", description: "พื้นฐานดันตัวจากพื้น" },
            { id: 2, name: "Pull-up", muscle_group: "Back/Biceps", description: "ดึงตัวขึ้นจากบาร์" },
            { id: 3, name: "Dips", muscle_group: "Triceps/Chest", description: "ดันตัวขึ้นลงระหว่างขนานบาร์" },
            { id: 4, name: "Shoulder Press", muscle_group: "Shoulders", description: "ยกดัมเบลเหนือหัว" },
            // Lower Body
            { id: 5, name: "Squat", muscle_group: "Legs/Glutes", description: "ย่อตัวและลุกขึ้น" },
            { id: 6, name: "Lunge", muscle_group: "Legs/Glutes", description: "ก้าวขาไปข้างหน้าและย่อตัว" },
            { id: 7, name: "Deadlift", muscle_group: "Hamstrings/Back", description: "ก้มยกน้ำหนักจากพื้น" },
            { id: 8, name: "Calf Raise", muscle_group: "Calves", description: "ยืนเขย่งปลายเท้า" },  
            // Core
            { id: 9, name: "Plank", muscle_group: "Core", description: "ท่าเกร็งลำตัว" },
            { id: 10, name: "Sit-up", muscle_group: "Abs", description: "งอตัวขึ้นจากพื้น" },
            { id: 11, name: "Crunch", muscle_group: "Abs", description: "เกร็งหน้าท้องขึ้นเล็กน้อย" },
            { id: 12, name: "Russian Twist", muscle_group: "Core", description: "บิดลำตัวซ้ายขวา" },
            { id: 13, name: "Leg Raise", muscle_group: "Lower Abs", description: "ยกขาตรงขึ้นลง" },
            // Cardio
            { id: 14, name: "Jumping Jack", muscle_group: "Full Body", description: "กระโดดกางแขนขา" },
            { id: 15, name: "Burpee", muscle_group: "Full Body", description: "ยืน-วิดพื้น-กระโดด" },
            { id: 16, name: "Mountain Climber", muscle_group: "Core/Legs", description: "วิ่งเข่าชันกับพื้น" },
            { id: 17, name: "High Knees", muscle_group: "Legs/Cardio", description: "วิ่งยกเข่าสูง" },
            // Flexibility
            { id: 18, name: "Stretching Hamstrings", muscle_group: "Hamstrings", description: "ยืดกล้ามเนื้อหลังขา" },
            { id: 19, name: "Stretching Shoulders", muscle_group: "Shoulders", description: "ยืดไหล่" },
            { id: 20, name: "Yoga Downward Dog", muscle_group: "Full Body Stretch", description: "ท่าสุนัขก้ม" },
            { id: 21, name: "Hip Opener Stretch", muscle_group: "Hips", description: "ยืดสะโพก" }
          ]);
        }
      } catch (error) {
        console.error("❌ Error fetching exercises:", error);
        // Fallback exercises (Popular ones)
        setAvailableExercises([
          { id: 1, name: "Push-up", muscle_group: "Chest/Triceps", description: "พื้นฐานดันตัวจากพื้น" },
          { id: 5, name: "Squat", muscle_group: "Legs/Glutes", description: "ย่อตัวและลุกขึ้น" },
          { id: 9, name: "Plank", muscle_group: "Core", description: "ท่าเกร็งลำตัว" },
          { id: 14, name: "Jumping Jack", muscle_group: "Full Body", description: "กระโดดกางแขนขา" },
          { id: 15, name: "Burpee", muscle_group: "Full Body", description: "ยืน-วิดพื้น-กระโดด" }
        ]);
      } finally {
        setLoadingExercises(false);
      }
    };

    fetchExercises();
  }, []);



  // NEW: Add segment function with immediate keypoints processing
  const addExerciseSegment = async () => {
    if (!newSegment.exerciseId) {
      alert('กรุณาเลือกท่าออกกำลังกาย');
      return;
    }
    if (newSegment.startTime >= newSegment.endTime) {
      alert('เวลาเริ่มต้องน้อยกว่าเวลาจบ\nกรุณาเลือกเวลาใหม่');
      return;
    }
    if (newSegment.endTime - newSegment.startTime < 5) {
      alert('ท่าออกกำลังกายต้องมีระยะเวลาอย่างน้อย 5 วินาที');
      return;
    }

    // ถ้าอยู่ในโหมดแก้ไข (มี editId) ให้ใช้วิธีเดิม
    if (editId) {
      const selectedExercise = availableExercises.find(ex => ex.id == newSegment.exerciseId);
      const segment = {
        id: Date.now(),
        exerciseId: newSegment.exerciseId,
        exerciseName: selectedExercise?.name || 'Unknown Exercise',
        muscleGroup: selectedExercise?.muscle_group || '',
        startTime: newSegment.startTime,
        endTime: newSegment.endTime,
        keypoints: []
      };
      
      setExerciseSegments(prev => [...prev, segment]);
      setNewSegment({ 
        exerciseId: '', 
        exerciseName: '', 
        startTime: 0, 
        endTime: 0, 
        isSelectingStart: false, 
        isSelectingEnd: false 
      });
      return;
    }

    // ถ้าเป็นการสร้างใหม่ และมี video ID แล้ว ให้สร้างผ่าน API
    if (videoId) {
      try {
        const selectedExercise = availableExercises.find(ex => ex.id == newSegment.exerciseId);
        
        const result = await videoSegmentService.createSegment(
          videoId,
          {
            exerciseId: parseInt(newSegment.exerciseId),
            startTime: newSegment.startTime,
            endTime: newSegment.endTime
          }
        );

        // เพิ่ม segment ใหม่เข้าไปใน state
        const newSegmentForState = {
          id: result.id,
          exerciseId: result.exercise_id,
          exerciseName: selectedExercise?.name || 'Unknown Exercise',
          muscleGroup: selectedExercise?.muscle_group || '',
          startTime: result.start_time,
          endTime: result.end_time
        };
        
        setExerciseSegments(prev => [...prev, newSegmentForState]);
        
        // รีเซ็ต form
        setNewSegment({ 
          exerciseId: '', 
          exerciseName: '', 
          startTime: 0, 
          endTime: 0, 
          isSelectingStart: false, 
          isSelectingEnd: false 
        });

        console.log('✅ Segment created:', result);

      } catch (error) {
        console.error('❌ Error creating segment:', error);
        alert(`เกิดข้อผิดพลาดในการสร้าง segment: ${error.message}`);
      }
    } else {
      // ถ้ายังไม่มี videoId ให้ใช้วิธีเดิม (เก็บ local state)
      const selectedExercise = availableExercises.find(ex => ex.id == newSegment.exerciseId);
      const segment = {
        id: Date.now(),
        exerciseId: newSegment.exerciseId,
        exerciseName: selectedExercise?.name || 'Unknown Exercise',
        muscleGroup: selectedExercise?.muscle_group || '',
        startTime: newSegment.startTime,
        endTime: newSegment.endTime,
        keypoints: []
      };
      
      setExerciseSegments(prev => [...prev, segment]);
      setNewSegment({ 
        exerciseId: '', 
        exerciseName: '', 
        startTime: 0, 
        endTime: 0, 
        isSelectingStart: false, 
        isSelectingEnd: false 
      });
    }
  };

  // NEW: Start selecting time range
  const startTimeSelection = () => {
    if (videoRef.current) {
      setNewSegment(prev => ({
        ...prev,
        startTime: videoRef.current.currentTime,
        isSelectingStart: true,
        isSelectingEnd: false
      }));
      
      // Auto-highlight the start time for 2 seconds
      setTimeout(() => {
        setNewSegment(prev => ({ ...prev, isSelectingStart: false }));
      }, 2000);
    }
  };

  // NEW: End selecting time range
  const endTimeSelection = () => {
    if (videoRef.current) {
      setNewSegment(prev => ({
        ...prev,
        endTime: videoRef.current.currentTime,
        isSelectingEnd: true
      }));
      
      // Auto-highlight the end time for 2 seconds
      setTimeout(() => {
        setNewSegment(prev => ({ ...prev, isSelectingEnd: false }));
      }, 2000);
    }
  };

  // NEW: Handle exercise selection
  const handleExerciseChange = (e) => {
    const exerciseId = e.target.value;
    const selectedExercise = availableExercises.find(ex => ex.id == exerciseId);
    setNewSegment(prev => ({
      ...prev,
      exerciseId,
      exerciseName: selectedExercise?.name || ''
    }));
  };

  // ฟังก์ชัน save draft - เพิ่ม segments
  const handleSaveDraft = async () => {
    if (!file || !name) {
      alert("กรุณาเลือกไฟล์และกรอกชื่อวิดีโอ");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      alert("ยังไม่ได้ล็อกอิน หรือ token หายไป (โปรดล็อกอินด้วยบัญชี Trainer)");
      return;
    }
    if (submittingDraft) return;
    setSubmittingDraft(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", name);
    formData.append("difficulty", level);
    formData.append("description", `kcal:${kcal};draft:true`);
    formData.append("approved", "false");
    
    // NEW: ส่งข้อมูล exercise segments สำหรับ draft ด้วย
    if (exerciseSegments.length > 0) {
      formData.append("segments", JSON.stringify(exerciseSegments.map(segment => ({
        exercise_id: segment.exerciseId,
        start_time: segment.startTime,
        end_time: segment.endTime
      }))));
    }

    try {
      const res = await fetch("http://localhost:8000/videos", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        let detail = "";
        try {
          const data = await res.json();
          detail = data.detail || "";
        } catch {}
        alert(`บันทึก draft ไม่สำเร็จ (${res.status}) ${detail}`);
        return;
      }
      alert(`บันทึก draft สำเร็จ! ${exerciseSegments.length > 0 ? `\n✅ บันทึก ${exerciseSegments.length} ท่าออกกำลังกายแล้ว` : ''}`);
      navigate("/trainer");
    } catch (e) {
      alert("เกิดข้อผิดพลาดในการบันทึก draft: " + (e?.message || e));
    } finally {
      setSubmittingDraft(false);
    }
  };
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef(null);

  // NEW: แยกโหมดแก้ไขจาก state หรือ query (?id=)
  const editId = location.state?.videoId || new URLSearchParams(location.search).get("id");
  const isEdit = !!editId;

  // ฟอร์ม
  const [file, setFile] = useState(null);
  const [fileURL, setFileURL] = useState(""); // ใช้ preview (ทั้งไฟล์ใหม่/ของเดิม)
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [level, setLevel] = useState("1");
  const [preview, setPreview] = useState(false);
  // เก็บสถานะเดิมของวิดีโอ (ใช้เช็คว่าถูก Reject อยู่หรือไม่)
  const [originalVideo, setOriginalVideo] = useState(null);

  // NEW: กันกดซ้ำ + แสดงสถานะตอนกำลังส่ง
  const [submitting, setSubmitting] = useState(false);

  const onPick = () => fileRef.current?.click();
  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setFileURL(URL.createObjectURL(f));
    setPreview(true); // Auto-enable preview when file is selected
    // Auto-enable keypoints when new video is loaded
    setShowKeypoints(true);
    setProcessingKeypoints(true);
    setTimeout(() => setProcessingKeypoints(false), 2000);
  };
  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFile(f);
    setFileURL(URL.createObjectURL(f));
    setPreview(true); // Auto-enable preview when file is dropped
    // Auto-enable keypoints when new video is loaded
    setShowKeypoints(true);
    setProcessingKeypoints(true);
    setTimeout(() => setProcessingKeypoints(false), 2000);
  };
  const onDragOver = (e) => e.preventDefault();

  // NEW: Prefill เมื่อเป็นโหมดแก้ไข (อ่านจาก state ก่อน, ไม่มีก็ค่อย GET /videos/:id)
  useEffect(() => {
    if (!isEdit) return;

    // ถ้ามีข้อมูลมากับ state ก็เติมเลย (เร็วกว่า)
    if (location.state?.video) {
      const v = location.state.video;
      setName(v.title || "");
      setLevel(String(v.difficulty || v.level || "1"));
      setKcal(
        v.kcal ??
          (typeof v.description === "string"
            ? (v.description.match(/kcal:(\d+)/)?.[1] ?? "")
            : "")
      );
      const url =
        v.image ||
        (v.s3_url
          ? /^https?:\/\//i.test(v.s3_url)
            ? v.s3_url
            : `http://localhost:8000/static/${v.s3_url.replace(/^.*[\\\/]/, "")}`
          : "");
      setFileURL(url);

      // Auto-enable keypoints for edit mode
      if (url) {
        setShowKeypoints(true);
        setProcessingKeypoints(true);
        setTimeout(() => setProcessingKeypoints(false), 2000);
      }
      
      // NEW: โหลด segments ที่มีอยู่แล้ว (ถ้ามี)
      if (v.segments && Array.isArray(v.segments)) {
        const loadedSegments = v.segments.map((seg, index) => ({
          id: Date.now() + index,
          exerciseId: seg.exercise_id,
          exerciseName: seg.exercise_name || 'Unknown Exercise',
          muscleGroup: seg.muscle_group || '',
          startTime: seg.start_time,
          endTime: seg.end_time,
          keypoints: []
        }));
        setExerciseSegments(loadedSegments);
      }

      setOriginalVideo(v);

      return;
    }

    // ไม่มีใน state -> ดึงจาก BE
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        // ดึงข้อมูลวิดีโอ
        const res = await fetch(`http://localhost:8000/videos/${editId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const v = await res.json();
        
        setName(v.title || "");
        setLevel(String(v.difficulty || v.level || "1"));
        setKcal(
          v.kcal ??
            (typeof v.description === "string"
              ? (v.description.match(/kcal:(\d+)/)?.[1] ?? "")
              : "")
        );
        const url =
          v.s3_url &&
          (!/^https?:\/\//i.test(v.s3_url)
            ? `http://localhost:8000/static/${v.s3_url.replace(/^.*[\\\/]/, "")}`
            : v.s3_url);
        setFileURL(url || "");

        
        if (url) {
          setShowKeypoints(true);
          setProcessingKeypoints(true);
          setTimeout(() => setProcessingKeypoints(false), 2000);
        }

        // NEW: ดึง segments ที่มีอยู่แล้ว
        try {
          const segmentRes = await fetch(`http://localhost:8000/videos/${editId}/segments`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (segmentRes.ok) {
            const segments = await segmentRes.json();
            if (Array.isArray(segments) && segments.length > 0) {
              const loadedSegments = segments.map((seg, index) => ({
                id: Date.now() + index,
                exerciseId: seg.exercise_id,
                exerciseName: seg.exercise_name || 'Unknown Exercise',
                muscleGroup: seg.muscle_group || '',
                startTime: seg.start_time,
                endTime: seg.end_time,
                keypoints: []
              }));
              setExerciseSegments(loadedSegments);
            }
          }
        } catch (segmentError) {
          console.warn("ไม่สามารถโหลด segments ได้:", segmentError);
        }

        setOriginalVideo(v);

      } catch {}
    })();
  }, [isEdit, editId, location.state]);

  // CHANGED: อัปโหลดใหม่ (POST /videos) + เช็ค token + กันกดซ้ำ + แสดง error ชัดเจน
  const handleCreate = async () => {
    if (!file || !name) {
      alert("กรุณาเลือกไฟล์และกรอกชื่อวิดีโอ");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      alert("ยังไม่ได้ล็อกอิน หรือ token หายไป (โปรดล็อกอินด้วยบัญชี Trainer)");
      return;
    }
    if (submitting) return;
    setSubmitting(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", name);
    formData.append("difficulty", level);
    formData.append("description", `kcal:${kcal};verifying:true`);
    formData.append("approved", "false");
    
    // NEW: ส่งข้อมูล exercise segments พร้อม debug
    if (exerciseSegments.length > 0) {
      const segmentsData = exerciseSegments.map(segment => ({
        exercise_id: segment.exerciseId,
        start_time: segment.startTime,
        end_time: segment.endTime
      }));
      
      console.log("🔥 Sending segments data:", segmentsData);
      formData.append("segments", JSON.stringify(segmentsData));
    } else {
      console.log("⚠️ No segments to send");
    }

    // Debug: Log all FormData contents
    console.log("📤 FormData contents:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      const res = await fetch("http://localhost:8000/videos", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      console.log("📥 Response status:", res.status);
      
      if (!res.ok) {
        let detail = "";
        try {
          const data = await res.json();
          detail = data.detail || "";
          console.error("❌ Response error:", data);
        } catch {}
        if (res.status === 401) {
          alert(`อัพโหลดไม่สำเร็จ (401 Unauthorized)\n${detail || "Token ไม่ถูกต้องหรือไม่มีการส่ง"}`);
        } else if (res.status === 403) {
          alert("อัพโหลดไม่สำเร็จ (403) — เฉพาะ Trainer เท่านั้น");
        } else {
          alert(`อัพโหลดไม่สำเร็จ (${res.status}) ${detail}`);
        }
        return;
      }

      const responseData = await res.json();
      console.log("✅ Upload success:", responseData);
      
      // เก็บ video ID สำหรับใช้ในการสร้าง segments
      if (responseData.id) {
        setVideoId(responseData.id);
        console.log(`📝 Video ID saved: ${responseData.id}`);
      }
      
      // หากมี segments ที่สร้างไว้ใน local state ให้สร้างผ่าน API
      if (responseData.id && exerciseSegments.length > 0) {
        try {
          const segmentsToCreate = exerciseSegments.map(segment => ({
            exerciseId: parseInt(segment.exerciseId),
            startTime: segment.startTime,
            endTime: segment.endTime
          }));

          const results = await videoSegmentService.createMultipleSegments(
            responseData.id,
            segmentsToCreate
          );

          console.log('✅ All segments created:', results);

        } catch (error) {
          console.error("⚠️ Segments creation failed:", error);
          alert(`เกิดข้อผิดพลาดในการสร้าง segments: ${error.message}`);
        }
      }
      
      alert(`กำลังตรวจสอบ (verifying)... คลิปจะเข้าสู่สถานะ Pending\n${exerciseSegments.length > 0 ? `✅ บันทึก ${exerciseSegments.length} ท่าออกกำลังกายแล้ว` : ''}`);
      navigate("/trainer");
    } catch (e) {
      console.error("❌ Upload error:", e);
      alert("เกิดข้อผิดพลาดในการอัพโหลด: " + (e?.message || e));
    } finally {
      setSubmitting(false);
    }
  };

  // NEW: โหมดแก้ไข ปรับให้รองรับ segments
  const handleUpdate = async () => {
    if (!name) {
      alert("กรุณากรอกชื่อวิดีโอ");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      alert("ยังไม่ได้ล็อกอิน หรือ token หายไป (โปรดล็อกอินด้วยบัญชี Trainer)");
      return;
    }
    if (submitting) return;
    setSubmitting(true);

    // 1) อัปเดต metadata
    const metaRes = await fetch(`http://localhost:8000/videos/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: name,
        difficulty: level,
        description: `kcal:${kcal}`,
      }),
    });
    if (!metaRes.ok) {
      let detail = "";
      try {
        const data = await metaRes.json();
        detail = data.detail || "";
      } catch {}
      alert(`อัปเดตไม่สำเร็จ (${metaRes.status}) ${detail}`);
      setSubmitting(false);
      return;
    }

    // 2) อัปเดต segments (ถ้ามี)
    if (exerciseSegments.length > 0) {
      try {
        const segmentRes = await fetch(`http://localhost:8000/videos/${editId}/segments`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            segments: exerciseSegments.map(segment => ({
              exercise_id: segment.exerciseId,
              start_time: segment.startTime,
              end_time: segment.endTime
            }))
          }),
        });
        
        if (!segmentRes.ok) {
          console.warn("ไม่สามารถอัปเดต segments ได้:", segmentRes.status);
        }
      } catch (error) {
        console.warn("Error updating segments:", error);
      }
    }

    // 3) ถ้าเลือกไฟล์ใหม่ -> อัปเดตไฟล์
    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      const fileRes = await fetch(`http://localhost:8000/videos/${editId}/file`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!fileRes.ok) {
        let detail = "";
        try {
          const data = await fileRes.json();
          detail = data.detail || "";
        } catch {}
        alert(`อัปเดตไฟล์ไม่สำเร็จ (${fileRes.status}) ${detail}`);
        setSubmitting(false);
        return;
      }
    }


    alert(`อัปเดตเรียบร้อย${exerciseSegments.length > 0 ? `\n✅ อัปเดต ${exerciseSegments.length} ท่าออกกำลังกายแล้ว` : ''}`);

    // 3) ถ้าสถานะเดิมเป็น Rejected ให้ Resubmit อัตโนมัติ
    if (originalVideo?.rejected) {
      try {
        const reRes = await fetch(`http://localhost:8000/videos/${editId}/resubmit`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (reRes.ok) {
          alert('อัปเดตและส่งให้แอดมินตรวจสอบอีกครั้งแล้ว (กลับสู่คิว Verifying/Pending)');
        } else {
          let detail = '';
          try { const d = await reRes.json(); detail = d.detail || ''; } catch {}
          alert(`อัปเดตสำเร็จ แต่ resubmit ไม่สำเร็จ (${reRes.status}) ${detail}`);
        }
      } catch (e) {
        alert('อัปเดตสำเร็จ แต่เกิดปัญหาในการ resubmit: ' + (e?.message || e));
      }
    } else {
      alert('อัปเดตเรียบร้อย');
    }

    setSubmitting(false);
    navigate('/trainer');
  };

  // header user
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  let user = { name: "Trainer" };
  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      const userObj = JSON.parse(userData);
      user = {
        name: userObj.name || "Trainer",
        picture: userObj.picture || "/user (1).png",
      };
    }
  } catch {}

  // NEW: Time formatting helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // NEW: Remove segment function
  const removeSegment = (segmentId) => {
    setExerciseSegments(prev => prev.filter(seg => seg.id !== segmentId));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#f8fafc 0%, #e2e8f0 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <TrainerHeader user={user} date={today} />

      {/* back button */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          marginTop: "12px",
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => navigate("/trainer")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "linear-gradient(90deg,#a855f7 0%, #ff4d8b 100%)",
            color: "#fff",
            fontWeight: 700,
            border: "none",
            borderRadius: 999,
            padding: "8px 22px 8px 16px",
            fontSize: "1.08rem",
            boxShadow: "0 2px 8px #a855f733",
            cursor: "pointer",
          }}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ marginRight: 4 }}
          >
            <path
              d="M12.5 15l-5-5 5-5"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          กลับหน้าหลัก
        </button>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 16px 40px 16px" }}>
        {/* Upload area */}
        <div style={box({ padding: 24, marginTop: 8 })}>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            style={{
              border: "2px dashed #d1d5db",
              borderRadius: 16,
              padding: "36px 20px",
              textAlign: "center",
              color: "#6b7280",
              background: "#f8fafc",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 6,
              }}
            >
              {isEdit ? "Replace video (optional)" : "Select video to upload"}
            </div>
            <div style={{ marginBottom: 16 }}>Or drag and drop it here</div>
            <button
              onClick={onPick}
              style={{
                background: "linear-gradient(90deg,#ff4d8b 0%, #a855f7 100%)",
                color: "#fff",
                fontWeight: 700,
                border: "none",
                borderRadius: 10,
                padding: "10px 18px",
                cursor: "pointer",
              }}
            >
              Select video
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              onChange={onFileChange}
              style={{ display: "none" }}
            />
            {file && (
              <div style={{ marginTop: 12, color: "#374151" }}>
                Selected: <b>{file.name}</b> ({Math.round(file.size / 1024 / 1024)} MB)
              </div>
            )}
          </div>
        </div>

        {/* Info row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 16,
            marginTop: 14,
          }}
        >
          {[
            { title: "Size and duration", desc: "Maximum size: 30 GB, video duration: 60 minutes" },
            { title: "File formats", desc: "Recommended: .mp4 (others supported)" },
            { title: "Video resolutions", desc: "Better: 1080p/1440p/4K" },
            { title: "Aspect ratios", desc: "Recommended: 16:9" },
          ].map((item, idx) => (
            <div key={idx} style={box({ padding: "14px 16px" })}>
              <div style={{ fontWeight: 700, color: "#111827", marginBottom: 6 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.4 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Details */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 20, marginTop: 24 }}>
          {/* Left form */}
          <div style={box({ padding: 20 })}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>
                {isEdit ? "Edit details" : "Details"}
              </div>
              <button
                onClick={() => setPreview((p) => !p)}
                style={{
                  border: "1.5px solid #e5e7eb",
                  background: "#fff",
                  color: "#a855f7",
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Preview
              </button>
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
                Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Pushups – Beginner Form"
                style={{
                  width: "97%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
                Kcalories *
              </label>
              <input
                type="number"
                min="0"
                value={kcal}
                onChange={(e) => setKcal(e.target.value)}
                placeholder="e.g., 60"
                style={{
                  width: 240,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                style={{
                  width: 180,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  outline: "none",
                  background: "#fff",
                }}
              >
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
              </select>
            </div>

            {/* Action buttons */}
            {/* ถ้าถูก Reject แสดงเหตุผล และอธิบายว่ากด Update จะส่งตรวจใหม่ */}
            {originalVideo?.rejected && (
              <div style={{
                marginTop: 12,
                padding: '12px 14px',
                borderRadius: 10,
                background: '#fee2e2',
                color: '#991b1b',
                fontSize: 14,
                lineHeight: 1.45,
                fontWeight: 500,
              }}>
                <div style={{fontWeight:700, marginBottom:4}}>วิดีโอนี้ถูก Reject</div>
                {originalVideo.reject_reason && (
                  <div style={{marginBottom:6}}>เหตุผล: {originalVideo.reject_reason}</div>
                )}
                <div>แก้ไขรายละเอียดหรืออัปโหลดไฟล์ใหม่ได้ แล้วกด Update เพื่อส่งให้แอดมินตรวจสอบอีกครั้ง</div>
              </div>
            )}
            <div style={{ display: "flex", gap: 12, marginTop: originalVideo?.rejected ? 12 : 20 }}>
              {isEdit ? (
                <button
                  onClick={handleUpdate}
                  disabled={submitting}                       // NEW: กันกดซ้ำ
                  style={{
                    opacity: submitting ? 0.7 : 1,            // NEW: ฟีดแบ็กกำลังส่ง
                    background: "linear-gradient(90deg,#ff4d8b 0%, #a855f7 100%)",
                    color: "#fff",
                    fontWeight: 700,
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 16px",
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Updating..." : "Update"}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm("ต้องรอ admin อนุมัติคลิปก่อนจึงจะเป็น Active\nกดยืนยันเพื่อส่งคลิปเข้าสู่สถานะ Pending")) {
                      handleCreate();
                    }
                  }}
                  disabled={submitting}
                  style={{
                    opacity: submitting ? 0.7 : 1,
                    background: "linear-gradient(90deg,#ff4d8b 0%, #a855f7 100%)",
                    color: "#fff",
                    fontWeight: 700,
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 16px",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <img
                    src={process.env.PUBLIC_URL + "/UploadSimple.png"}
                    alt="upload"
                    style={{
                      width: 20,
                      height: 20,
                      marginRight: 6,
                      verticalAlign: "middle",
                    }}
                  />
                  {submitting ? "Uploading..." : "Public"}
                </button>
              )}
              <button
                onClick={handleSaveDraft}
                disabled={submittingDraft}
                style={{
                  background: "#e5e7eb",
                  color: "#111827",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 16px",
                  cursor: submittingDraft ? "not-allowed" : "pointer",
                  opacity: submittingDraft ? 0.7 : 1,
                }}
              >
                {submittingDraft ? "Saving..." : "Save draft"}
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Discard changes and go back to Trainer page?')) {
                    navigate('/trainer');
                  }
                }}
                disabled={submitting}
                style={{
                  background: "#fff",
                  color: "#6b7280",
                  fontWeight: 700,
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "10px 16px",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                Discard
              </button>
            </div>


          </div>

          {/* Right preview pane */}
          <div
            style={box({
              padding: 16,
              minHeight: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            {!fileURL ? (
              <div
                style={{
                  width: "100%",
                  height: 320,
                  borderRadius: 12,
                  background: "#e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6b7280",
                }}
              >
                "No video selected"
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <video
                  ref={videoRef}
                  src={fileURL}
                  controls
                  loop
                  autoPlay
                  muted
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                  onEnded={() => setIsVideoPlaying(false)}
                  onLoadedData={() => {
                    // Auto-play and enable keypoints when video loads
                    if (videoRef.current) {
                      setVideoDuration(videoRef.current.duration);
                      videoRef.current.play().catch(() => {
                        // If autoplay fails, just continue without error
                      });
                    }
                  }}
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      setCurrentTime(videoRef.current.currentTime);
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: 320,
                    objectFit: 'contain',
                    borderRadius: 12,
                    background: '#fff',
                    display: 'block'
                  }}
                />
                {showKeypoints && (
                  <KeypointOverlay
                    videoRef={videoRef}
                    isPlaying={isVideoPlaying}
                    onKeypointsDetected={(detectedKeypoints) => {
                      setKeypoints(detectedKeypoints);
                      // เก็บ keypoints พร้อม timestamp
                      if (detectedKeypoints && videoRef.current) {
                        const timestamp = videoRef.current.currentTime;
                        setAllKeypoints(prev => [
                          ...prev.filter(kp => Math.abs(kp.timestamp - timestamp) > 0.1), // หลีกเลี่ยง duplicate
                          { timestamp, keypoints: detectedKeypoints }
                        ]);
                      }
                    }}
                  />
                )}
                
                {/* Toggle button for keypoints */}
                <button
                  onClick={() => {
                    setShowKeypoints(!showKeypoints);
                    if (!showKeypoints) {
                      setProcessingKeypoints(true);
                      // หยุด processing หลัง 2 วินาที (เพื่อให้ดู realistic)
                      setTimeout(() => setProcessingKeypoints(false), 2000);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: showKeypoints ? '#10b981' : processingKeypoints ? '#f59e0b' : '#374151',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    zIndex: 20
                  }}
                >
                  {processingKeypoints ? 'Processing...' : showKeypoints ? 'Hide Keypoints' : 'Show Keypoints'}
                </button>
                
                {/* Keypoint count indicator */}
                {showKeypoints && keypoints && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 50,
                      right: 10,
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: '11px',
                      zIndex: 20
                    }}
                  >
                    {keypoints.length} keypoints detected
                  </div>
                )}

                {/* Current time display */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 50,
                    left: 10,
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: '11px',
                    zIndex: 20
                  }}
                >
                  {formatTime(currentTime)} / {formatTime(videoDuration)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NEW: Time Picker Section */}
        {fileURL && (
          <div style={{ marginTop: 24 }}>
            <div style={box({ padding: 20 })}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
                Exercise Time Segments
              </div>
              
              {/* Add new segment form */}
              <div style={{ 
                background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", 
                padding: 20, 
                borderRadius: 12, 
                marginBottom: 16,
                border: "2px solid #0ea5e9"
              }}>
                {/* Validation message */}
                {exerciseSegments.length === 0 && (
                  <div style={{
                    background: "rgba(251, 191, 36, 0.1)",
                    border: "1px solid #f59e0b",
                    borderRadius: 8,
                    padding: "12px 16px",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}>
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    <span style={{ color: "#92400e", fontSize: 14, fontWeight: 500 }}>
                      แนะนำให้เพิ่มท่าออกกำลังกายอย่างน้อย 1 ท่า เพื่อให้ระบบสามารถวิเคราะห์ keypoints ได้แม่นยำ
                    </span>
                  </div>
                )}

                {/* Exercise Selection Dropdown */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#0c4a6e" }}>
                    🏋️ Select Exercise
                  </label>
                  <div style={{ position: "relative" }}>
                    <select
                      value={newSegment.exerciseId}
                      onChange={handleExerciseChange}
                      disabled={loadingExercises}
                      style={{
                        width: "100%",
                        maxWidth: "450px",
                        padding: "12px 16px",
                        borderRadius: 8,
                        border: "2px solid #0ea5e9",
                        outline: "none",
                        fontSize: 14,
                        fontWeight: 500,
                        background: "white",
                        cursor: loadingExercises ? "wait" : "pointer",
                        appearance: "none",
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: "right 12px center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "16px",
                        paddingRight: "40px"
                      }}
                    >
                      <option value="" style={{ color: "#6b7280", fontStyle: "italic" }}>
                        {loadingExercises ? "🔄 Loading exercises..." : "-- Choose an exercise --"}
                      </option>
                      
                      {/* Upper Body Group */}
                      <optgroup label="💪 Upper Body" style={{ fontWeight: "bold", color: "#374151" }}>
                        {availableExercises
                          .filter(ex => ex.muscle_group?.includes("Chest") || ex.muscle_group?.includes("Back") || 
                                       ex.muscle_group?.includes("Triceps") || ex.muscle_group?.includes("Biceps") || 
                                       ex.muscle_group?.includes("Shoulders"))
                          .map((exercise) => (
                            <option 
                              key={exercise.id} 
                              value={exercise.id}
                              style={{ padding: "8px", color: "#111827" }}
                            >
                              {exercise.name} ({exercise.muscle_group})
                            </option>
                          ))}
                      </optgroup>

                      {/* Lower Body Group */}
                      <optgroup label="🦵 Lower Body" style={{ fontWeight: "bold", color: "#374151" }}>
                        {availableExercises
                          .filter(ex => ex.muscle_group?.includes("Legs") || ex.muscle_group?.includes("Glutes") || 
                                       ex.muscle_group?.includes("Hamstrings") || ex.muscle_group?.includes("Calves"))
                          .map((exercise) => (
                            <option 
                              key={exercise.id} 
                              value={exercise.id}
                              style={{ padding: "8px", color: "#111827" }}
                            >
                              {exercise.name} ({exercise.muscle_group})
                            </option>
                          ))}
                      </optgroup>

                      {/* Core Group */}
                      <optgroup label="🎯 Core & Abs" style={{ fontWeight: "bold", color: "#374151" }}>
                        {availableExercises
                          .filter(ex => ex.muscle_group?.includes("Core") || ex.muscle_group?.includes("Abs"))
                          .map((exercise) => (
                            <option 
                              key={exercise.id} 
                              value={exercise.id}
                              style={{ padding: "8px", color: "#111827" }}
                            >
                              {exercise.name} ({exercise.muscle_group})
                            </option>
                          ))}
                      </optgroup>

                      {/* Cardio/Full Body Group */}
                      <optgroup label="🔥 Cardio & Full Body" style={{ fontWeight: "bold", color: "#374151" }}>
                        {availableExercises
                          .filter(ex => ex.muscle_group?.includes("Full Body") || ex.muscle_group?.includes("Cardio"))
                          .map((exercise) => (
                            <option 
                              key={exercise.id} 
                              value={exercise.id}
                              style={{ padding: "8px", color: "#111827" }}
                            >
                              {exercise.name} ({exercise.muscle_group})
                            </option>
                          ))}
                      </optgroup>

                      {/* Flexibility Group */}
                      <optgroup label="🧘 Flexibility & Stretch" style={{ fontWeight: "bold", color: "#374151" }}>
                        {availableExercises
                          .filter(ex => ex.muscle_group?.includes("Stretch") || ex.muscle_group?.includes("Hips") || 
                                       ex.name?.toLowerCase().includes("stretch") || ex.name?.toLowerCase().includes("yoga"))
                          .map((exercise) => (
                            <option 
                              key={exercise.id} 
                              value={exercise.id}
                              style={{ padding: "8px", color: "#111827" }}
                            >
                              {exercise.name} ({exercise.muscle_group})
                            </option>
                          ))}
                      </optgroup>
                    </select>

                    {/* Loading indicator */}
                    {loadingExercises && (
                      <div style={{
                        position: "absolute",
                        right: "40px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "16px",
                        height: "16px",
                        border: "2px solid #0ea5e9",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                      }} />
                    )}
                  </div>

                  {/* Exercise info display */}
                  {newSegment.exerciseId && (
                    <div style={{
                      marginTop: 8,
                      padding: "8px 12px",
                      background: "rgba(14, 165, 233, 0.1)",
                      border: "1px solid rgba(14, 165, 233, 0.3)",
                      borderRadius: 6,
                      fontSize: 13,
                      color: "#0c4a6e"
                    }}>
                      <strong>Selected:</strong> {newSegment.exerciseName}
                      {availableExercises.find(ex => ex.id == newSegment.exerciseId)?.description && (
                        <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                          {availableExercises.find(ex => ex.id == newSegment.exerciseId)?.description}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Time Selection - ใช้ปุ่มอย่างเดียว ไม่ต้องกรอกตัวเลข */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 1fr", 
                  gap: 20, 
                  marginBottom: 16,
                  padding: 16,
                  background: "rgba(255,255,255,0.6)",
                  borderRadius: 8,
                  border: "1px solid rgba(14, 165, 233, 0.3)"
                }}>
                  <div>
                    <label style={{ 
                      display: "block", 
                      fontWeight: 600, 
                      marginBottom: 8, 
                      fontSize: 14, 
                      color: "#0c4a6e" 
                    }}>
                      ⏰ Start Time
                    </label>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ 
                        background: newSegment.isSelectingStart ? "#10b981" : "#f1f5f9",
                        color: newSegment.isSelectingStart ? "white" : "#0c4a6e",
                        padding: "12px 16px",
                        borderRadius: 8,
                        fontSize: 18,
                        fontWeight: 700,
                        marginBottom: 8,
                        border: newSegment.isSelectingStart ? "2px solid #059669" : "2px solid #cbd5e1"
                      }}>
                        {formatTime(newSegment.startTime)}
                      </div>
                      <button
                        onClick={startTimeSelection}
                        style={{
                          background: newSegment.isSelectingStart 
                            ? "linear-gradient(90deg, #10b981 0%, #059669 100%)" 
                            : "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          padding: "8px 16px",
                          fontSize: 13,
                          cursor: "pointer",
                          fontWeight: 600,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          width: "100%"
                        }}
                      >
                        {newSegment.isSelectingStart ? "✅ Selected!" : "Use Current Time"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ 
                      display: "block", 
                      fontWeight: 600, 
                      marginBottom: 8, 
                      fontSize: 14, 
                      color: "#0c4a6e" 
                    }}>
                      ⏰ End Time
                    </label>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ 
                        background: newSegment.isSelectingEnd ? "#10b981" : "#f1f5f9",
                        color: newSegment.isSelectingEnd ? "white" : "#0c4a6e",
                        padding: "12px 16px",
                        borderRadius: 8,
                        fontSize: 18,
                        fontWeight: 700,
                        marginBottom: 8,
                        border: newSegment.isSelectingEnd ? "2px solid #059669" : "2px solid #cbd5e1"
                      }}>
                        {formatTime(newSegment.endTime)}
                      </div>
                      <button
                        onClick={endTimeSelection}
                        style={{
                          background: newSegment.isSelectingEnd 
                            ? "linear-gradient(90deg, #10b981 0%, #059669 100%)" 
                            : "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          padding: "8px 16px",
                          fontSize: 13,
                          cursor: "pointer",
                          fontWeight: 600,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          width: "100%"
                        }}
                      >
                        {newSegment.isSelectingEnd ? "✅ Selected!" : "Use Current Time"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Duration Info */}
                {newSegment.startTime < newSegment.endTime && (
                  <div style={{ 
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid #10b981",
                    borderRadius: 6,
                    padding: "8px 12px",
                    marginBottom: 16,
                    textAlign: "center"
                  }}>
                    <span style={{ color: "#059669", fontWeight: 600, fontSize: 14 }}>
                      ⏱️ Duration: {Math.floor(newSegment.endTime - newSegment.startTime)} seconds
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button
                    onClick={addExerciseSegment}
                    disabled={!newSegment.exerciseId || newSegment.startTime >= newSegment.endTime}
                    style={{
                      background: !newSegment.exerciseId || newSegment.startTime >= newSegment.endTime
                        ? "#4196dbff" 
                        : "linear-gradient(90deg,#10b981 0%, #059669 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      padding: "12px 24px",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: !newSegment.exerciseId || newSegment.startTime >= newSegment.endTime 
                        ? "not-allowed" 
                        : "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                  >
                    <img 
                      src={process.env.PUBLIC_URL + "/plus.png"} 
                      alt="add" 
                      style={{ width: 16, height: 16 }}
                    />
                    Add Exercise Segment
                  </button>
                  
                  {newSegment.exerciseName && newSegment.startTime < newSegment.endTime && (
                    <div style={{ 
                      fontSize: 13, 
                      color: "#059669", 
                      display: "flex", 
                      alignItems: "center",
                      background: "rgba(16, 185, 129, 0.1)",
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontWeight: 500
                    }}>
                      ✨ <strong>{newSegment.exerciseName}</strong> 
                      ({formatTime(newSegment.startTime)} - {formatTime(newSegment.endTime)})
                    </div>
                  )}
                </div>
              </div>

              {/* Existing segments list */}
              {exerciseSegments.length > 0 && (
                <div>
                  <div style={{ 
                    fontWeight: 700, 
                    marginBottom: 12, 
                    color: "#374151",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}>
                    📋 Defined Segments ({exerciseSegments.length})
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {exerciseSegments.map((segment, index) => (
                      <div
                        key={segment.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                          border: "2px solid #e5e7eb",
                          borderRadius: 10,
                          padding: "14px 18px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                        }}
                      >
                        <div>
                          <div style={{ 
                            fontWeight: 700, 
                            color: "#111827",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4
                          }}>
                            <span style={{ 
                              background: "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)",
                              color: "white",
                              borderRadius: "50%",
                              width: 28,
                              height: 28,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 700
                            }}>
                              {index + 1}
                            </span>
                            {segment.exerciseName}
                            {segment.muscleGroup && (
                              <span style={{
                                background: "rgba(59, 130, 246, 0.1)",
                                color: "#1d4ed8",
                                padding: "2px 8px",
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 600
                              }}>
                                {segment.muscleGroup}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: "#6b7280", marginLeft: 36 }}>
                            ⏱️ {formatTime(segment.startTime)} - {formatTime(segment.endTime)} 
                            <span style={{ 
                              marginLeft: 8,
                              background: "rgba(16, 185, 129, 0.1)",
                              color: "#059669",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600
                            }}>
                              {Math.floor(segment.endTime - segment.startTime)}s duration
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeSegment(segment.id)}
                          style={{
                            background: "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 12px",
                            fontSize: 12,
                            cursor: "pointer",
                            fontWeight: 600,
                            boxShadow: "0 2px 4px rgba(239, 68, 68, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          <img 
                            src={process.env.PUBLIC_URL + "/bin (1).png"} 
                            alt="remove" 
                            style={{ width: 14, height: 14 }}
                          />
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
