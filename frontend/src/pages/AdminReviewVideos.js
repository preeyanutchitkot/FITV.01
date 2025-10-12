
import React, { useEffect, useMemo, useState } from "react";
import ReviewToolbar from "../components/admin/ReviewToolbar";
import ReviewCard from "../components/admin/ReviewCard";
import VideoModal from "../components/admin/VideoModal";
import "../styles/AdminReviewVideos.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

function ensureVideoURL(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE}/static/${String(url).replace(/^.*[\\\/]/, "")}`;
}
function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString(); } catch { return String(d); }
}

export default function AdminReviewVideos() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal: reject
  const [rejecting, setRejecting] = useState(null); // {id, title}
  const [reason, setReason] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("all");
  const [sortBy, setSortBy] = useState("created"); // created|title|trainer
  const [order, setOrder] = useState("desc");       // asc|desc

  // preview
  const [preview, setPreview] = useState(null); // {id,title,src}

  const token = localStorage.getItem("admin_token");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/admin/videos/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = r.ok ? await r.json() : [];
      const mapped = (Array.isArray(data) ? data : []).map(v => ({
        ...v,
        _src: ensureVideoURL(v.s3_url),
        _title: (v.title || "").toLowerCase(),
        _trainer: Number(v.trainer_id) || 0,
        _trainerName: (v.trainer_name || "").toLowerCase(), // ⬅️ ใช้ค้น/เรียง
        _created: v.created_at ? new Date(v.created_at).getTime() : 0,
        _difficulty: (v.difficulty || "Unspecified").trim(),
        _createdLabel: fmtDate(v.created_at),
      }));
      setRows(mapped);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const levelOptions = useMemo(
    () => Array.from(new Set(rows.map(r => r._difficulty))).filter(Boolean).sort(),
    [rows]
  );

  const list = useMemo(() => {
    let arr = [...rows];

    // ค้นหาจากชื่อเรื่อง, id เทรนเนอร์, และ "ชื่อเทรนเนอร์"
    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      arr = arr.filter(v =>
        v._title.includes(qq) ||
        String(v.trainer_id).includes(qq) ||
        (v._trainerName && v._trainerName.includes(qq))
      );
    }

    if (level !== "all") arr = arr.filter(v => v._difficulty === level);

    // เรียง
    arr.sort((a, b) => {
      let av, bv;
      if (sortBy === "title") { av = a._title; bv = b._title; }
      else if (sortBy === "trainer") {
        // มีชื่อให้ใช้ชื่อก่อน; ถ้าไม่มีค่อย fallback เป็น id
        av = a._trainerName || String(a._trainer);
        bv = b._trainerName || String(b._trainer);
      } else { av = a._created; bv = b._created; }
      if (av < bv) return order === "asc" ? -1 : 1;
      if (av > bv) return order === "asc" ? 1 : -1;
      return 0;
    });

    return arr;
  }, [rows, q, level, sortBy, order]);

  const approve = async (id) => {
    const r = await fetch(`${API_BASE}/admin/videos/${id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) load(); else alert("Approve failed");
  };

  return (
    <div className="ar-bg">
      <nav className="ar-nav">
        <div className="ar-brand">FitAddict Admin</div>
        <button className="btn btn-outline" onClick={() => (window.location.href = "/admin")}>
          ← Back
        </button>
      </nav>

      <main className="ar-container">
        <header className="ar-header">
          <h1>Pending Videos</h1>
          <ReviewToolbar
            q={q} setQ={setQ}
            level={level} setLevel={setLevel} levelOptions={levelOptions}
            sortBy={sortBy} setSortBy={setSortBy}
            order={order} toggleOrder={() => setOrder(o => o === 'asc' ? 'desc' : 'asc')}
            onReload={load}
          />
        </header>

        {loading ? (
          <div className="ar-loading">Loading…</div>
        ) : list.length === 0 ? (
          <div className="ar-empty">ไม่มีวิดีโอรอตรวจ</div>
        ) : (
          <section className="ar-grid">
            {list.map(v => (
              <ReviewCard
                key={v.id}
                video={v}
                onApprove={() => approve(v.id)}
                onReject={() => setRejecting({ id: v.id, title: v.title })}
                onPlay={() => setPreview({ id: v.id, title: v.title, src: v._src })}
              />
            ))}
          </section>
        )}
      </main>

      {/* Reject modal */}
      {rejecting && (
        <>
          <div className="ar-modal-backdrop" onClick={() => setRejecting(null)} />
          <div className="ar-modal" style={{ maxWidth: 500 }}>
            <div className="ar-modal-header">
              <div className="ar-modal-title">Reject: {rejecting.title}</div>
              <button className="btn btn-outline" onClick={() => setRejecting(null)}>✕</button>
            </div>

            <textarea
              className="ar-input"
              style={{ width: '95%', height: 140, resize: 'vertical' }}
              placeholder="ใส่เหตุผล/คำแนะนำ เช่น เสียงเบาเกินไป, มุมกล้องไม่เห็นท่าชัด ฯลฯ"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                className="btn btn-reject"
                onClick={async () => {
                  const r = await fetch(`${API_BASE}/admin/videos/${rejecting.id}/reject`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ reason }),
                  });
                  if (r.ok) {
                    setRejecting(null);
                    setReason("");
                    load();
                  } else {
                    alert("Reject failed");
                  }
                }}
              >
                Confirm reject
              </button>
              <button className="btn btn-outline" onClick={() => setRejecting(null)}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      <VideoModal
        open={!!preview}
        title={preview?.title}
        src={preview?.src}
        onClose={() => setPreview(null)}
      />
    </div>
  );
}
