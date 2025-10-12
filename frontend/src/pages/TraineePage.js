import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startPolling } from '../utils/polling';
import TraineeHeader from '../components/TraineeHeader';
import TrainerCard from '../components/TrainerCard';
import VideoCard from '../components/VideoCard';
import UserActivityCard from '../components/UserActivityCard';

const defaultTrainer = {
  name: '',
  picture: '',
  members: 0,
  videos: 0,
  id: null
};

function TraineePage() {
  const navigate = useNavigate();
  // Poll /users/ping ทุก 10 วินาทีเพื่ออัปเดตสถานะออนไลน์ และเรียกทันทีหลัง login
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    // เรียกทันทีหลัง login
    fetch('http://localhost:8000/users/ping', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    // Poll ทุก 10 วินาที
    const interval = setInterval(() => {
      fetch('http://localhost:8000/users/ping', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);
  // ฟังก์ชันดึงวิดีโอของ trainer
  const fetchTrainerVideos = async (trainerId) => {
    const token = localStorage.getItem('token');
    if (trainerId) {
      const res = await fetch(`http://localhost:8000/trainers/${trainerId}/videos`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const vids = await res.json();
        console.log('🎬 Videos data from API:', vids);
        console.log('🎬 Video IDs:', vids?.map(v => ({id: v.id, title: v.title})));
        setVideos(Array.isArray(vids) ? vids : []);
      }
    }
  };
  const [user, setUser] = useState(null);
  const [trainer, setTrainer] = useState(defaultTrainer);
  const [videos, setVideos] = useState([]);
  const [userLevel, setUserLevel] = useState(1); // สมมติว่ามี field level ใน user หรือดึงจาก backend

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const userObj = JSON.parse(userData);
      setUser({
        ...userObj,
        profile_image: userObj.profile_image || userObj.picture || '/user (1).png',
        name: userObj.name || userObj.email || '',
        email: userObj.email || '',
      });
      setUserLevel(userObj.level || 1);
      // เรียก /users/ping เพื่ออัปเดตสถานะออนไลน์ของ trainee
      const token = localStorage.getItem('token');
      if (token) {
        fetch('http://localhost:8000/users/ping', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    }
  }, []);

  useEffect(() => {
    // ดึง trainer ของ trainee จาก backend
    const fetchTrainerAndVideos = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:8000/my-trainer', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setTrainer({
            name: data.name,
            picture: data.profile_image || data.picture || '/user (1).png',
            members: data.members || 0,
            videos: data.videos || 0,
            id: data.id
          });
          // ดึงวิดีโอของ trainer
          fetchTrainerVideos(data.id);
        }
      } catch { }
    };
    fetchTrainerAndVideos();
  }, []);

  // Polling: ดึงวิดีโอใหม่ทุก 5 วินาที
  useEffect(() => {
    if (!trainer.id) return;
    const stop = startPolling(() => fetchTrainerVideos(trainer.id), 5000);
    return stop;
  }, [trainer.id]);

  if (!user) return (<div className="dashboard-loading"><div className="loading-spinner"></div><p>กำลังโหลด...</p></div>);

  // แบ่งวิดีโอตาม level (สมมติแต่ละ video มี field level)
  // แบ่งวิดีโอตาม difficulty (ใช้แทน level)
  const videosByDifficulty = {};
  videos.forEach(v => {
    const diff = v.difficulty || 'ไม่ระบุ';
    if (!videosByDifficulty[diff]) videosByDifficulty[diff] = [];
    videosByDifficulty[diff].push(v);
  });
  const sortedDifficulties = Object.keys(videosByDifficulty);

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="dashboard" style={{ background: '#f8fafc' }}>
      <TraineeHeader user={user} points={0} date={today} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 0' }}>
        <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#334155', marginBottom: '1.25rem' }}>My trainer</div>
        <TrainerCard trainer={{ ...trainer, videos: videos.length }} />
        {/* วิดีโอแบ่งตาม level */}
        <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#334155', marginBottom: '0.5rem' }}>Videolist ({videos.length})</div>
        {sortedDifficulties.map(diff => (
          <div key={diff}>
            <div style={{ marginBottom: '0.5rem', color: '#64748b', fontWeight: 600 }}>
              Level: {diff} ({videosByDifficulty[diff].length})
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
              gap: '32px',
              alignItems: 'stretch',
              justifyItems: 'stretch',
              marginBottom: '1.5rem',
              padding: '0'
            }}>
              {videosByDifficulty[diff].map(v => (
                (() => {
                  // เฉพาะสถานะที่ต้องการให้แสดง
                  let status = (v.statusBtn || v.status || 'Not Started');
                  if (!["Pass", "Try Again", "Not Started", "Locked"].includes(status)) return null;
                  
                  // Debug video data
                  console.log('Video data:', v);
                  
                  // Build video URL with better fallback
                  let videoUrl = '';
                  
                  // Try s3_url first
                  if (v.s3_url) {
                    if (/^https?:\/\//i.test(v.s3_url)) {
                      videoUrl = v.s3_url;
                    } else {
                      // Clean filename and create static URL
                      const filename = v.s3_url.replace(/^.*[\\\/]/, '');
                      videoUrl = `http://localhost:8000/static/${encodeURIComponent(filename)}`;
                    }
                  } 
                  // Try image field
                  else if (v.image) {
                    if (/^https?:\/\//i.test(v.image)) {
                      videoUrl = v.image;
                    } else {
                      const filename = v.image.replace(/^.*[\\\/]/, '');
                      videoUrl = `http://localhost:8000/static/${encodeURIComponent(filename)}`;
                    }
                  }
                  // Fallback to a test video
                  else {
                    videoUrl = 'http://localhost:8000/static/slide.mp4';
                  }
                  
                  console.log('Final video URL:', videoUrl);
                  
                  return (
                    <VideoCard
                      key={v.id}
                      video={{
                        ...v,
                        image: videoUrl,
                        statusBtn: status
                      }}
                      cardHeight="stretch"
                      cardMargin={0}
                      onPlay={() => navigate(`/workout/${v.id}`)}
                    />
                  );
                })()
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TraineePage;

