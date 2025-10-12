// src/pages/AdminTrainerView.js
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "../styles/AdminTrainerView.css";
import VideoCard from "../components/VideoCard";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export default function AdminTrainerView() {
  const { trainerId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    id: trainerId,
    name: state?.trainer?.name || "",
    email: state?.trainer?.email || "",
    picture: `${API_BASE}/profile-image/${trainerId}`,
  });
  const [videos, setVideos] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      // โปรไฟล์เทรนเนอร์ (ใช้ /trainers/{id})
      const p = await fetch(`${API_BASE}/trainers/${trainerId}`);
      if (p.ok) {
        const pj = await p.json();
        setProfile(prev => ({
          ...prev,
          name: pj.name || prev.name,
          email: pj.email || prev.email,
        }));
      }

      // วิดีโอที่ approved ของเทรนเนอร์ (ใช้ของเดิม)
      const r = await fetch(`${API_BASE}/trainers/${trainerId}/videos`);
      let vids = r.ok ? await r.json() : [];
      vids = Array.isArray(vids)
        ? vids.map(v => {
          let url = v.s3_url || "";
          if (url && !/^https?:\/\//i.test(url)) {
            url = `${API_BASE}/static/${url.replace(/^.*[\\\/]/, "")}`;
          }
          return { ...v, image: url, statusBtn: v.approved ? "Active" : "Draft" };
        })
        : [];
      setVideos(vids);

      // รายชื่อสมาชิกของเทรนเนอร์ (เอ็นด์พอยต์ใหม่ /admin/trainers/{id}/trainees)
      const m = await fetch(`${API_BASE}/admin/trainers/${trainerId}/trainees`);
      const mj = m.ok ? await m.json() : [];
      console.log('Admin trainees data:', mj); // Debug: ดูข้อมูลที่ได้จาก API
      setTrainees(Array.isArray(mj) ? mj : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [trainerId]);

  return (
    <div className="atv-shell">
      {/* Top bar */}
      <div className="atv-topbar">
        <button className="atv-back" onClick={() => navigate(-1)}>← Back</button>
        <img 
          className="atv-avatar" 
          src={profile.picture || `${API_BASE}/profile-image/${profile.id}` || "/user (1).png"} 
          alt="avatar" 
          onError={(e) => { e.currentTarget.src = "/user (1).png"; }}
        />
        <div className="atv-name">{profile.name || "Trainer"}</div>
        <div className="atv-email">{profile.email}</div>
      </div>

      {/* Content shell */}
      <div className="atv-container">
        <aside className="atv-aside">
          <div className="atv-aside-head">
            <img 
              className="atv-aside-avatar" 
              src={profile.picture || `${API_BASE}/profile-image/${profile.id}` || "/user (1).png"} 
              alt="avatar" 
              onError={(e) => { e.currentTarget.src = "/user (1).png"; }}
            />
            <div className="atv-aside-title">{profile.name}</div>
            <span className="atv-dot-online" />
          </div>
          <hr className="atv-divider" />
          <div className="atv-aside-sub">Memberlist ({trainees.length})</div>

          <div className="atv-list-scroll">
            {trainees.length === 0 ? (
              <div className="atv-empty">ยังไม่มีสมาชิก</div>
            ) : (
              trainees.map(t => (
                <div key={t.id} className="atv-row">
                  <button
                    className="atv-row-main"
                    onClick={() =>
                      navigate(`/admin/trainees/${t.id}`, { state: { trainee: t } })
                    }
                  >
                    <img
                      className="atv-row-avatar"
                      src={t.profile_image || `${API_BASE}/profile-image/${t.id}`}
                      onError={(e) => { e.currentTarget.src = "/user (1).png"; }}
                      alt=""
                    />
                    <div className="atv-row-info">
                      <div className="atv-row-name">{t.name || "—"}</div>
                      <div className="atv-row-email">{t.email}</div>
                    </div>
                    <span className="atv-row-status" />
                  </button>
                  <button className="atv-kebab" title="Actions" disabled>⋮</button>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="atv-main">
          <div className="atv-main-head">
            <div className="atv-main-title">Videolist ({videos.length})</div>
          </div>

          {loading ? (
            <div className="atv-loading">Loading…</div>
          ) : videos.length === 0 ? (
            <div className="atv-empty">ยังไม่มีวิดีโอ</div>
          ) : (
            <div className="atv-grid">
              {videos.map(v => (
                <VideoCard
                  key={v.id}
                  video={{
                    id: v.id,
                    title: v.title,
                    image: v.image,
                    duration: v.duration || "",
                    kcal: v.kcal || "",
                    statusBtn: v.statusBtn || (v.approved ? "Active" : "Draft"),
                  }}
                  cardHeight="stretch"
                  cardMargin={4}
                  readOnly
                  onPlay={() => { }}
                />
              ))}
            </div>



          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
            <button
              onClick={() => navigate(`/admin/trainers/${profile.id}/videos`)}
              className="trainer-morebar"
              title="Open all videos"
            >
               More
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
