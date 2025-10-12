// src/pages/TraineeAnalyticsPage.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import UserActivityCard from "../components/UserActivityCard";
import VideoCard from "../components/VideoCard";
import StreakCalendar from "../components/analytics/StreakCalendar";
import WeeklyFrequencyChart from "../components/analytics/WeeklyFrequencyChart";
import CurrentStatsCard from "../components/analytics/CurrentStatsCard";
import PersonalRecordsCard from "../components/analytics/PersonalRecordsCard";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

function SectionTitle({ children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 6 }}>
      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#111827' }}>{children}</div>
      {right}
    </div>
  );
}

function AnalyticsHeader({ trainee, onBack, avatar }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>← Back</button>
      <img src={avatar} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }} />
      <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{trainee.name || "Trainee"}</div>
      <span style={{ marginLeft: 8, background: '#f3e8ff', color: '#a855f7', padding: '2px 10px', borderRadius: 999, fontWeight: 700, fontSize: '0.95rem' }}>
        {(trainee.points ?? 0)}pts
      </span>
      <div style={{ marginLeft: 'auto', color: '#6b7280', fontSize: 13 }} />
    </div>
  );
}

export default function TraineeAnalyticsPage() {
  const { traineeId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [trainee, setTrainee] = useState(state?.trainee || { id: traineeId });
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const avatar = `${API_BASE}/profile-image/${traineeId}`;

  // โหลดข้อมูลจริง
  useEffect(() => {
    let stop = false;

    async function load() {
      setLoading(true);
      try {
        // profile
        const p = await fetch(`${API_BASE}/trainees/${traineeId}`);
        const pJson = p.ok ? await p.json() : {};
        if (stop) return;
        setTrainee(prev => ({ ...prev, ...pJson, id: traineeId }));

        // trainer & videos
        const token = localStorage.getItem("token");
        const me = localStorage.getItem("user");
        const myEmail = me ? (JSON.parse(me).email || "") : "";
        const tRes = await fetch(`${API_BASE}/trainers`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const trainers = tRes.ok ? await tRes.json() : [];
        const myTrainer = Array.isArray(trainers)
          ? (trainers.find(t => t.email === myEmail) || trainers[0])
          : null;

        if (myTrainer?.id) {
          const vRes = await fetch(`${API_BASE}/trainers/${myTrainer.id}/videos`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          let vids = vRes.ok ? await vRes.json() : [];
          vids = Array.isArray(vids) ? vids.map(v => {
            let url = v.s3_url || "";
            if (url && !/^https?:\/\//i.test(url)) {
              url = `${API_BASE}/static/${url.replace(/^.*[\\\/]/, "")}`;
            }
            return { ...v, image: url };
          }) : [];
          if (!stop) setVideos(vids);
        } else {
          if (!stop) setVideos([]);
        }
      } catch {
        if (!stop) setVideos([]);
      } finally {
        if (!stop) setLoading(false);
      }
    }

    load();
    return () => { stop = true; };
  }, [traineeId]);

  // group videos
  const groups = useMemo(() => {
    const by = {};
    videos.forEach(v => {
      const key = v.difficulty || v.level || "ไม่ระบุ";
      if (!by[key]) by[key] = [];
      by[key].push(v);
    });
    return by;
  }, [videos]);

  const levels = Object.keys(groups);

  const shell = {
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    minHeight: '100vh',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  // === Responsive top grid: 2-cols บนจอกว้าง, 1-col บนจอแคบ ===
  const gridRef = useRef(null);
  const [oneCol, setOneCol] = useState(false);
  useEffect(() => {
    if (!gridRef.current) return;
    const el = gridRef.current;
    const ro = new ResizeObserver((entries) => {
      const width = Math.round(entries[0].contentRect.width);
      // กำหนด threshold ที่ ~900px
      setOneCol(width < 900);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div style={shell}>
      {/* spacer เดิมไม่จำเป็น ตัดออกเพื่อไม่ให้เกิด box แปลก ๆ */}
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div
          style={{
            background: '#f3f4f6',
            borderRadius: 20,
            boxShadow: '0 2px 24px rgba(0,0,0,0.10)',
            maxWidth: 1400,
            margin: '0 auto 2rem',
            padding: '2.2rem 2.6rem',
            minHeight: 800,
            display: 'flex',
            flexDirection: 'column',
            gap: 24
          }}
        >
          <AnalyticsHeader trainee={trainee} onBack={() => navigate(-1)} avatar={avatar} />

          <div style={{ fontWeight: 800, fontSize: '1.35rem', color: '#111827' }}>Analytics Dashboard</div>
          <div style={{ color: '#6b7280', marginTop: -8 }}>
            Track performance metrics and gain insights into your daily motion activity.
          </div>

          {/* === Analytics Top Row === */}
          <div
            ref={gridRef}
            style={{
              display: 'grid',
              gridTemplateColumns: oneCol ? '1fr' : '1.4fr 1fr',
              gap: 18,
              alignItems: 'stretch',
              width: '100%',
            }}
          >
            {/* ซ้าย */}
            <div style={{ minWidth: 0 }}>
              <StreakCalendar data={[{ date: new Date().toISOString(), value: 1 }]} />
            </div>

            {/* ขวา */}
            <div style={{ minWidth: 0 }}>
              <CurrentStatsCard streakDays={8} avgScore={87} />
            </div>

            {/* แถวล่าง ซ้าย */}
            <div style={{ minWidth: 0 }}>
              <WeeklyFrequencyChart
                data={[
                  { weekLabel: 'Week 1', value: 4 },
                  { weekLabel: 'Week 2', value: 2 },
                  { weekLabel: 'Week 3', value: 3 },
                  { weekLabel: 'Week 4', value: 1 },
                  { weekLabel: 'Week 5', value: 5 },
                ]}
              />
            </div>

            {/* แถวล่าง ขวา */}
            <div style={{ minWidth: 0 }}>
              <PersonalRecordsCard maxStreak={12} longestWorkout={'42:15'} totalWorkouts={47} />
            </div>
          </div>

          {/* === Videolist === */}
          <SectionTitle>Videolist ({videos.length})</SectionTitle>
          {loading ? (
            <div style={{ color: '#64748b' }}>Loading…</div>
          ) : (
            (levels.length ? levels : ['ไม่ระบุ']).map(level => (
              <div key={level} style={{ marginBottom: '1.2rem' }}>
                <div style={{ marginBottom: '0.5rem', color: '#64748b', fontWeight: 600 }}>
                  Level: {level} ({groups[level]?.length || 0})
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
                    gap: 22,
                    width: '100%'
                  }}
                >
                  {(groups[level] || []).map(v => (
                    <VideoCard
                      key={v.id || v.s3_url || v.title}
                      video={v}
                      readOnly
                      onPlay={() => {}}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
          {!loading && videos.length === 0 && <div style={{ color: '#94a3b8' }}>No videos</div>}
        </div>
      </div>
    </div>
  );
}
