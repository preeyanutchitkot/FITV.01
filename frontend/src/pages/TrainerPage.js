import React, { useEffect, useState } from 'react';
import { startPolling } from '../utils/polling';
import '../components/Dashboard.css';
import TrainerHeader from '../components/TrainerHeader';
import { useNavigate } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import InviteTrainee from '../components/InviteTrainee';
import { useLoading } from '../contexts/LoadingProvider';


const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

const themePurple = {
  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
  minHeight: '100vh',
  fontFamily: 'Inter, sans-serif',
};

function TrainerPage() {
  // Online status logic (from backend)
  const [trainerOnline, setTrainerOnline] = useState(false);
  // Polling: ดึงวิดีโอใหม่ทุก 5 วินาที
  useEffect(() => {
    const stop = startPolling(() => fetchVideos(), 5000);
    return stop;
  }, []);
  // ฟังก์ชันลบวิดีโอ
  const handleDeleteVideo = async (videoId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8000/videos/${videoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('ลบวิดีโอไม่สำเร็จ');
      // ลบสำเร็จ: อัปเดตรายการวิดีโอ
      setVideos(videos => videos.filter(v => v.id !== videoId));
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการลบวิดีโอ');
      console.error(e);
    }
  };
  const navigate = useNavigate(); // ✅ ต้องอยู่ใน component

  // State สำหรับวิดีโอจริง (ต้องอยู่บนสุด)
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({ name: '', email: '', picture: '', is_online: false });
  const [trainees, setTrainees] = useState([]); // ✅ รายชื่อลูกเทรนจริง
  const { withLoading, showLoading, hideLoading } = useLoading();

  const [showSidebar, setShowSidebar] = useState(true);

  // ดึงวิดีโอของ trainer (ต้องอยู่บนสุด)
  const fetchVideos = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/my-videos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('โหลดวิดีโอไม่สำเร็จ');

    let vids = await res.json();
    vids = Array.isArray(vids) ? vids.map(v => {
      let url = v.s3_url || '';
      // ถ้า s3_url เป็น /static/ path แล้ว ให้เพิ่ม API_BASE
      if (url && url.startsWith('/static/')) {
        url = `${API_BASE}${url}`;
      } else if (url && !/^https?:\/+/.test(url)) {
        // สำหรับ URL อื่นๆ ที่ไม่ใช่ /static/ และไม่ใช่ HTTP(S)
        url = `${API_BASE}/static/${url.replace(/^.*[\\\/]/, '')}`;
      }
      // เพิ่ม logic เช็ค draft
      let status = '';
      if (typeof v.description === 'string' && v.description.includes('draft:true')) {
        status = 'draft';
      }
      // ดึงเลข kcal จาก description
      let kcal = undefined;
      if (typeof v.description === 'string') {
        const match = v.description.match(/kcal:(\d+)/);
        if (match) kcal = Number(match[1]);
      }
      return { ...v, image: url, s3_url: url, status, kcal };
    }) : [];

    setVideos(vids);
  } catch (e) {
    console.error(e);
  }
};

  // ดึงวิดีโอเมื่อเข้าเพจ (ต้องอยู่บนสุด)
  useEffect(() => {
    fetchVideos();
    fetchTrainees();
    fetchTrainerOnline();
  }, []);

  // Poll backend for online status every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTrainees();
      fetchTrainerOnline();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // ดึงสถานะออนไลน์ของเทรนเนอร์จาก backend
  const fetchTrainerOnline = async () => {
    const token = localStorage.getItem('token');
    if (!token || !profile.id) return;
    try {
      const res = await fetch(`http://localhost:8000/trainers/${profile.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('โหลดสถานะเทรนเนอร์ไม่สำเร็จ');
      const data = await res.json();
      setTrainerOnline(!!data.is_online);
      setProfile(p => ({ ...p, is_online: !!data.is_online }));
    } catch (e) {
      setTrainerOnline(false);
    }
  };
  const [menuTraineeId, setMenuTraineeId] = useState(null);


  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });


  const openMenu = (e, trainee) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    const MENU_W = 180;
    setMenuPos({
      top: r.bottom + 8,
      left: Math.min(window.innerWidth - MENU_W - 12, r.right - MENU_W),
    });
    setSelectedTrainee(trainee);
    setMenuOpen(true);
  };

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && closeMenu();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);




  // ✅ ดึงลูกเทรนจาก BE (อ่าน token ข้างใน ไม่ต้องรับพารามิเตอร์)
  const fetchTrainees = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8000/my-trainees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('โหลดรายชื่อสมาชิกไม่สำเร็จ');
      const data = await res.json();
      console.log('Trainees data:', data); // Debug: ดูข้อมูลที่ได้จาก API
      setTrainees(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };


  useEffect(() => {
    const close = () => setMenuTraineeId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const handleDelete = async (t) => {
    if (!window.confirm(`Remove ${t.name || t.email} from your team?`)) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/my-trainees/${t.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Delete failed");
      }
      // เอาออกจาก state ทันที หรือจะเรียก fetchTrainees() ก็ได้
      setTrainees(prev => prev.filter(x => x.id !== t.id));
      setMenuTraineeId(null);
    } catch (e) {
      alert(e.message);
    }
  };


  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoading(true);

    // ดึง user จาก localStorage
    const userData = localStorage.getItem('user');
    let userPic = '';
    let userName = '';
    if (userData) {
      try {
        const userObj = JSON.parse(userData);
        userPic = userObj.picture || '';
        userName = userObj.name || '';
      } catch { }
    }

    // เลือก trainer ของผู้ใช้ และดึงโปรไฟล์ (ตามโค้ดเดิม)
    fetch('http://localhost:8000/trainers', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(trainers => {
        let trainer = null;
        if (Array.isArray(trainers) && trainers.length > 0) {
          if (userData) {
            try {
              const userObj = JSON.parse(userData);
              trainer = trainers.find(t => t.email === userObj.email) || trainers[0];
            } catch {
              trainer = trainers[0];
            }
          } else {
            trainer = trainers[0];
          }
        }
        if (trainer) {
          // Always use backend proxy for profile image
          return fetch(`http://localhost:8000/trainers/${trainer.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(profileData => {
              setProfile({
                id: trainer.id,
                name: userName || trainer.name,
                email: trainer.email,
                picture: `http://localhost:8000/profile-image/${trainer.id}`,
                is_online: profileData.is_online,
                last_active: profileData.last_active
              });
              setTrainerOnline(!!profileData.is_online);
              // เรียก /users/ping เพื่ออัปเดตสถานะออนไลน์ทันทีหลัง login
              const token = localStorage.getItem('token');
              if (token) {
                fetch('http://localhost:8000/users/ping', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` }
                }).then(() => fetchTrainerOnline());
              } else {
                fetchTrainerOnline();
              }
            });
        } else {
          throw new Error('ไม่พบข้อมูลเทรนเนอร์');
        }
      })
      .catch(() => setError('เกิดข้อผิดพลาดในการโหลดข้อมูลเทรนเนอร์'))
      .finally(() => setIsLoading(false));

    // ✅ โหลดลูกเทรนจริงคู่ขนาน
    fetchTrainees();
  }, []);


  if (isLoading) {
    return (
      <div className="dashboard-loading">
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
          <span className="runner-text">LOADING...</span>
        </div>
      </div>

    );
  }
  if (error) return <div className="error-message">{typeof error === 'string' ? error : (error.message || 'เกิดข้อผิดพลาด')}</div>;

  return (
    <div className="dashboard trainer-dashboard-bg" style={themePurple}>
      {/* header */}
      <TrainerHeader
        user={{ id: profile.id, name: profile.name, picture: profile.picture || '/user (1).png' }}
        date={new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      />

      {/* White card: covers both memberlist and videolist */}
      <div style={{
        background: '#fff',
        borderRadius: 24,
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        maxWidth: 1400,
        minWidth: 340,
        margin: '2rem auto',
        padding: '2.2rem 2.5rem',
        minHeight: 600,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 0,
        width: '100%'
      }}>
        {/* Trainer profile row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 10 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img 
              src={profile.picture || `${API_BASE}/profile-image/${profile.id}` || "/user (1).png"} 
              alt="avatar" 
              style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #e5e7eb' }}
              onError={(e) => { e.currentTarget.src = "/user (1).png"; }}
            />
            <span style={{
              position: 'absolute',
              right: 2,
              bottom: 2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: (profile.is_online === true || profile.is_online === 'true') ? '#22c55e' : '#cbd5e1', // เขียวถ้าออนไลน์, เทาถ้าออฟไลน์
              border: '2px solid #fff',
              display: 'inline-block',
              transition: 'background 0.2s'
            }}></span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.45rem', color: '#23272e', marginLeft: 12 }}>{profile.name}</div>
        </div>
        {/* Full-width divider */}
  <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '8px 0 32px 0', width: '100%' }} />
        {/* Main content: flex row for memberlist and videolist */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 0, width: '100%' }}>
          {/* Memberlist (left) */}
          <aside style={{
            minWidth: 340,
            maxWidth: 380,
            flex: '0 0 350px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            height: '100%',
            paddingRight: '2rem',
            background: 'none',
            borderRadius: 0,
            boxShadow: 'none',
          }}>
         
          <div style={{ fontWeight: 700, fontSize: '1.18rem', marginBottom: 12 }}>
            Memberlist ({trainees.length})
          </div>
          <InviteTrainee onSuccess={fetchTrainees} />
          <div className="trainer-list__scroll">
            {trainees.length === 0 ? (
              <div style={{ color: '#64748b' }}>ยังไม่มีสมาชิกในทีม</div>
            ) : (
              trainees.map((t) => (
                <div key={t.id} className="trainee-row" style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img 
                      className="trainee-row__avatar" 
                      src={t.profile_image || `${API_BASE}/profile-image/${t.id}`}
                      onError={(e) => { e.currentTarget.src = "/user (1).png"; }}
                      alt="avatar" 
                    />
                    {/* Online status dot + debug */}
                    {(() => { console.log('TrainerPage Trainee:', t.id, 'is_online:', t.is_online); return null; })()}
                    <span style={{
                      position: 'absolute',
                      right: 2,
                      bottom: 2,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: ((() => {
                        if (t.is_online === true || t.is_online === 1) return '#22c55e';
                        if (typeof t.is_online === 'string') {
                          const v = t.is_online.trim().toLowerCase();
                          if (v === 'true' || v === '1' || v === 'online' || v === 'active') return '#22c55e';
                        }
                        if (typeof t.is_online === 'boolean' && t.is_online) return '#22c55e';
                        return '#cbd5e1';
                      })()),
                      border: '2px solid #fff',
                      display: 'inline-block',
                      transition: 'background 0.2s'
                    }}></span>
                  </div>
                  <button
                    className="trainee-row__main"
                    onClick={() =>
                      navigate(`/trainer/trainees/${t.id}`, { state: { trainee: t } })
                    }
                    style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginLeft: 12 }}
                  >
                    <div className="trainee-row__info">
                      <div className="trainee-row__name">{t.name || 'Unnamed'}</div>
                      <div className="trainee-row__email">{t.email}</div>
                    </div>
                  </button>
                  <button
                    className="kebab"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen && selectedTrainee?.id === t.id}
                    onClick={(e) => openMenu(e, t)}
                  >
                    ⋮
                  </button>
                </div>
              ))
            )}
            {menuOpen && (
              <>
                <div className="menu-backdrop" onClick={closeMenu} />
                <div className="row-menu row-menu--fixed" style={{ top: menuPos.top, left: menuPos.left }}>
                  <button
                    className="row-menu__item"
                    onClick={() => {
                      handleDelete(selectedTrainee);
                      closeMenu();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>
          {/* Videolist (main content) */}
          <main style={{ flex: 1, padding: '0' }}>
          {/* Videolist label above video grid, with more top margin */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -10, marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: '1.18rem' }}>Videolist ({videos.length})</div>
            <button
              onClick={() => navigate('/trainer/upload')}
              style={{
                background: 'linear-gradient(90deg,#ff4d8b 0%, #a855f7 100%)',
                color: '#fff', fontWeight: 700, border: 'none', borderRadius: 18,
                padding: '0.6rem 1.7rem', fontSize: '1.05rem', display: 'flex',
                alignItems: 'center', gap: 9, cursor: 'pointer'
              }}
            >
              <img src={process.env.PUBLIC_URL + '/UploadSimple.png'} alt="upload"
                style={{ width: 20, height: 20, marginRight: 6, verticalAlign: 'middle' }} />
              Upload
            </button>
          </div>
          {/* Responsive Video Grid: show only first 6 videos */}
          <div className="video-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '32px',
            marginTop: 0
          }}>
            {videos.length === 0 ? (
              <div style={{ color: '#64748b' }}>ยังไม่มีวิดีโอ</div>
            ) : (
              videos.slice(0, 6).map(v => (
                <VideoCard
                  key={v.id}
                  video={{
                    ...v,
                    statusBtn:
                      v.rejected ? 'Rejected' : (
                        v.status === 'draft' ? 'Draft'
                        : v.approved ? 'Active'
                        : 'Verifying'
                      )
                  }}
                  cardHeight="stretch"
                  cardMargin={4}
                  onDelete={handleDeleteVideo}
                  onCardClick={() => navigate('/trainer/upload', { state: { mode: 'edit', videoId: v.id, video: v } })}
                />
              ))
            )}
          </div>
          {/* More button: only show if there are more than 6 videos */}
          {videos.length > 6 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button
                style={{
                  background: '#e5e7eb',
                  color: '#23272e',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: 14,
                  padding: '0.5rem 1.3rem',
                  fontSize: '1.02rem',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/trainer/videos')}
              >
                More
              </button>
            </div>
          )}
        </main>
        </div>
      </div>
    </div>
  );
}

export default TrainerPage;