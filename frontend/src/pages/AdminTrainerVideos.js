import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/AdminTrainerVideos.css";
import VideoCard from "../components/VideoCard";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

function parseDuration(val){ if (typeof val === "number") return val; if (!val) return 0; const m = String(val).match(/[\d.]+/); return m ? parseFloat(m[0]) : 0; }
function parseKcal(val){ if (typeof val === "number") return val; if (!val) return 0; const m = String(val).match(/[\d.]+/); return m ? parseFloat(m[0]) : 0; }
function getSortableDate(v){ return new Date(v.created_at || v.updated_at || 0).getTime() || Number(v.id) || 0; }

function getLevelKey(v){
  const raw = v.difficulty ?? v.level ?? "";
  if (raw == null) return "Unspecified";
  const s = String(raw).trim();
  const m = s.match(/(\d+)/);
  return m ? `Level ${m[1]}` : (s || "Unspecified");
}
function levelOrderKey(levelKey){
  const m = String(levelKey).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

export default function AdminTrainerVideos(){
  const { trainerId } = useParams();
  const navigate = useNavigate();

  const [videos, setVideos]   = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date"); // date|title|duration|kcal
  const [order, setOrder]   = useState("desc");

  // NEW: state สำหรับกรองตามเลเวล
  const [levelFilter, setLevelFilter] = useState("all");

  useEffect(() => {
    let stop = false;
    (async () => {
      setLoading(true);
      try{
        const r = await fetch(`${API_BASE}/trainers/${trainerId}/videos`);
        let vids = r.ok ? await r.json() : [];
        vids = Array.isArray(vids) ? vids.map(v => {
          let url = v.s3_url || "";
          if (url && !/^https?:\/\//i.test(url)) {
            url = `${API_BASE}/static/${url.replace(/^.*[\\\/]/,'')}`;
          }
          return {
            ...v,
            image: url,
            __dur:  parseDuration(v.duration),
            __kcal: parseKcal(v.kcal),
            __date: getSortableDate(v),
            __title: (v.title || "").toLowerCase(),
            __status: (v.approved ? "active" : "draft"),
            __levelKey: getLevelKey(v),
          };
        }) : [];
        if (!stop) setVideos(vids);
      } finally{
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
  }, [trainerId]);

  // NEW: รายการเลเวลทั้งหมดไว้ทำดรอปดาวน์ (เรียงจากน้อยไปมาก)
  const levelOptions = useMemo(() => {
    const keys = Array.from(new Set(videos.map(v => v.__levelKey || "Unspecified")));
    return keys.sort((a,b) => levelOrderKey(a) - levelOrderKey(b));
  }, [videos]);

  // รายการที่ถูกกรอง + เรียง (แสดงเป็นกริดเดียว)
  const list = useMemo(() => {
    let rows = [...videos];

    if (q.trim()){
      const qq = q.trim().toLowerCase();
      rows = rows.filter(v => v.__title.includes(qq));
    }
    if (status !== "all"){
      rows = rows.filter(v => v.__status === status);
    }
    // NEW: กรองตามเลเวล
    if (levelFilter !== "all"){
      rows = rows.filter(v => (v.__levelKey || "Unspecified") === levelFilter);
    }

    rows.sort((a,b) => {
      let av, bv;
      switch (sortBy){
        case "title":    av = a.__title;  bv = b.__title;  break;
        case "duration": av = a.__dur;    bv = b.__dur;    break;
        case "kcal":     av = a.__kcal;   bv = b.__kcal;   break;
        default:         av = a.__date;   bv = b.__date;   break;
      }
      if (av < bv) return order === "asc" ? -1 : 1;
      if (av > bv) return order === "asc" ?  1 : -1;
      return 0;
    });
    return rows;
  }, [videos, q, status, levelFilter, sortBy, order]);

  return (
    <div className="mv-shell">
      <div className="mv-toolbar">
        <button className="mv-back" onClick={() => navigate(-1)}>← Back</button>

        <div className="mv-right">
          <input
            className="mv-search"
            placeholder="Search title…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />

          {/* NEW: ดรอปดาวน์กรอง Level */}
          <div className="mv-filter">
            <label>Level:</label>
            <select value={levelFilter} onChange={(e)=>setLevelFilter(e.target.value)}>
              <option value="all">All</option>
              {levelOptions.map(lv => (
                <option key={lv} value={lv}>{lv}</option>
              ))}
            </select>
          </div>

          <div className="mv-filter">
            <label>Status:</label>
            <select value={status} onChange={(e)=>setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="mv-filter">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)}>
              <option value="date">Newest</option>
              <option value="title">Title</option>
              <option value="duration">Duration</option>
              <option value="kcal">Kcal</option>
            </select>
          </div>

          <button
            className="mv-order"
            onClick={() => setOrder(o => o === "asc" ? "desc" : "asc")}
            title="Toggle order"
          >
            {order === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      <div className="mv-container">
        {loading ? (
          <div className="mv-loading">Loading…</div>
        ) : list.length === 0 ? (
          <div className="mv-empty">No videos</div>
        ) : (
          <div className="mv-grid">
            {list.map(v => (
              <VideoCard
                key={v.id}
                video={{ ...v, statusBtn: v.approved ? "Active" : "Draft" }}
                readOnly
                onPlay={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
