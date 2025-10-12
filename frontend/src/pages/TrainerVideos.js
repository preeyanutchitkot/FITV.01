// src/pages/TrainerVideos.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminTrainerVideos.css";        // reuse css ของ master video
import VideoCard from "../components/VideoCard";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

/* ---------- helpers ---------- */
function parseNumber(val) {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const m = String(val).match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}
function getSortableDate(v) {
  return new Date(v.created_at || v.updated_at || 0).getTime() || Number(v.id) || 0;
}
function getLevelKey(v) {
  const raw = v.difficulty ?? v.level ?? "";
  if (raw == null) return "Unspecified";
  const s = String(raw).trim();
  const m = s.match(/(\d+)/);
  return m ? `Level ${m[1]}` : (s || "Unspecified");
}
function levelOrderKey(levelKey) {
  const m = String(levelKey).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

/* ---------- page ---------- */
export default function TrainerVideos() {
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // เพิ่มฟังก์ชันลบวิดีโอ
  const handleDeleteVideo = async (videoId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/videos/${videoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('ลบวิดีโอไม่สำเร็จ');
      setVideos(videos => videos.filter(v => v.id !== videoId));
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการลบวิดีโอ');
      console.error(e);
    }
  };

  // controls
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");     // all|active|draft
  const [levelFilter, setLevelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");    // date|title|duration|kcal|level
  const [order, setOrder] = useState("desc");      // asc|desc

  useEffect(() => {
    let stop = false;
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const r = await fetch(`${API_BASE}/my-videos`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        let vids = r.ok ? await r.json() : [];
        vids = Array.isArray(vids)
            ? vids.map((v) => {
                let url = v.s3_url || "";
                if (url && !/^https?:\/\//i.test(url)) {
                  url = `${API_BASE}/static/${url.replace(/^.*[\\\/]/, "")}`;
                }
                // ดึงเลข kcal จาก description
                let kcal = v.kcal;
                if (!kcal && typeof v.description === "string") {
                  const match = v.description.match(/kcal:(\d+)/);
                  if (match) kcal = Number(match[1]);
                }
                // แปลง duration จากวินาทีเป็นนาที ถ้ามี
                let durationMin = undefined;
                if (v.duration != null) {
                  const durNum = parseNumber(v.duration);
                  durationMin = durNum > 0 ? Math.round((durNum / 60) * 10) / 10 : 0;
                }
                return {
                  ...v,
                  image: url,
                  kcal,
                  // Pass raw duration (seconds) for display
                  duration: v.duration,
                  __title: (v.title || "").toLowerCase(),
                  __dur: v.duration,
                  __kcal: parseNumber(kcal),
                  __date: getSortableDate(v),
                  // เพิ่มสถานะ rejected แยกจาก draft/active
                  __status: v.rejected ? "rejected" : (v.approved ? "active" : "draft"),
                  __levelKey: getLevelKey(v),
                };
              })
          : [];
        if (!stop) setVideos(vids);
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  // สร้างรายการตัวเลือกเลเวล (เรียงจากน้อยไปมาก)
  const levelOptions = useMemo(() => {
    const keys = Array.from(new Set(videos.map((v) => v.__levelKey || "Unspecified")));
    return keys.sort((a, b) => levelOrderKey(a) - levelOrderKey(b));
  }, [videos]);

  // กรอง + เรียงผลลัพธ์ (แสดงเป็นกริดเดียว)
  const list = useMemo(() => {
    let rows = [...videos];

    // search
    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      rows = rows.filter((v) => v.__title.includes(qq));
    }
    // filter by status
    if (status !== "all") {
      rows = rows.filter((v) => v.__status === status);
    }
    // filter by level
    if (levelFilter !== "all") {
      rows = rows.filter((v) => (v.__levelKey || "Unspecified") === levelFilter);
    }

    // sort
    rows.sort((a, b) => {
      let av, bv;
      switch (sortBy) {
        case "title":
          av = a.__title; bv = b.__title; break;
        case "duration":
          av = a.__dur; bv = b.__dur; break;
        case "kcal":
          av = a.__kcal; bv = b.__kcal; break;
        case "level":
          av = levelOrderKey(a.__levelKey || "Unspecified");
          bv = levelOrderKey(b.__levelKey || "Unspecified");
          break;
        default: // date
          av = a.__date; bv = b.__date; break;
      }
      if (av < bv) return order === "asc" ? -1 : 1;
      if (av > bv) return order === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [videos, q, status, levelFilter, sortBy, order]);

  return (
    <div className="mv-shell">
      {/* Toolbar */}
      <div className="mv-toolbar">
        <button className="mv-back" onClick={() => navigate(-1)}>← Back</button>

        <div className="mv-right">
          <input
            className="mv-search"
            placeholder="Search title…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <div className="mv-filter">
            <label>Level:</label>
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
              <option value="all">All</option>
              {levelOptions.map((lv) => (
                <option key={lv} value={lv}>{lv}</option>
              ))}
            </select>
          </div>

          <div className="mv-filter">
            <label>Status:</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="mv-filter">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">Newest</option>
              <option value="title">Title</option>
              <option value="duration">Duration</option>
              <option value="kcal">Kcal</option>
              <option value="level">Level</option>
            </select>
          </div>

          <button
            className="mv-order"
            onClick={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
            title="Toggle order"
          >
            {order === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mv-container">
        {loading ? (
          <div className="mv-loading">Loading…</div>
        ) : list.length === 0 ? (
          <div className="mv-empty">No videos</div>
        ) : (
          <div className="mv-grid">
            {list.map((v) => (
              <VideoCard
                key={v.id}
                video={{
                  ...v,
                  statusBtn:
                    v.rejected ? "Rejected" : (
                      (typeof v.description === "string" && v.description.includes("draft:true"))
                        ? "Draft"
                        : v.approved
                        ? "Active"
                        : "Verifying"
                    )
                }}
                onDelete={handleDeleteVideo}
                readOnly={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
