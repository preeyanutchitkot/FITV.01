// src/pages/AdminTraineeView.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "../styles/AdminTraineeView.css";
import AdminPageHeader from "../components/AdminPageHeader";
import UserActivityCard from "../components/UserActivityCard";
import VideoCard from "../components/VideoCard";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export default function AdminTraineeView() {
    const { traineeId } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();

    const [trainee, setTrainee] = useState(state?.trainee || { id: traineeId });
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    const avatar = `${API_BASE}/profile-image/${traineeId}`;

    useEffect(() => {
        let stop = false;
        async function load() {
            setLoading(true);
            try {
                // 1) ดึงข้อมูล Trainee
                const p = await fetch(`${API_BASE}/trainees/${traineeId}`);
                const pj = p.ok ? await p.json() : {};
                if (stop) return;
                setTrainee(prev => ({ ...prev, ...pj, id: traineeId }));

                // 2) หา trainer_id ของ trainee คนนี้
                let trainerId = pj?.trainer_id;
                const f = await fetch(`${API_BASE}/admin/trainees/${traineeId}/trainer`);
                if (f.ok) {
                    const fj = await f.json();
                    trainerId = fj?.trainer_id ?? trainerId;
                }

                // 3) ถ้าเจอ trainer → ดึงวิดีโอของ trainer
                if (trainerId) {
                    const r = await fetch(`${API_BASE}/trainers/${trainerId}/videos`);
                    let vids = r.ok ? await r.json() : [];
                    vids = Array.isArray(vids) ? vids.map(v => {
                        let url = v.s3_url || "";
                        if (url && !/^https?:\/\//i.test(url)) {
                            url = `${API_BASE}/static/${url.replace(/^.*[\\\/]/, "")}`;
                        }
                        return { ...v, image: url };
                    }) : [];
                    setVideos(vids);
                } else {
                    setVideos([]);
                }

            } finally {
                if (!stop) setLoading(false);
            }
        }
        load();
        return () => { stop = true; };
    }, [traineeId]);

    // group ตาม level/difficulty
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

    return (
        <div className="atv2-shell">
            <AdminPageHeader
                avatar={avatar}
                title={trainee.name || "Trainee"}
                points={trainee.points ?? 0}
                onBack={() => navigate(-1)}
                menuItems={[
                    // ไว้เพิ่ม action ภายหลัง เช่น Reset password / Suspend / Export…
                    // { label: "Suspend Trainee", onClick: () => {} },
                ]}
            />

            <div className="atv2-container">
                <div className="atv2-grid">
                    <div className="atv2-card">
                        <div className="atv2-card-title">Document Views (Last 30 Days)</div>
                        <div className="atv2-card-ghost">
                            Chart visualization<br />Showing 0 total views
                        </div>
                    </div>
                    <UserActivityCard />
                </div>

                <div className="atv2-h2">Videolist ({videos.length})</div>
                {loading ? (
                    <div className="atv2-loading">Loading…</div>
                ) : levels.length ? (
                    levels.map(level => (
                        <div key={level} style={{ marginBottom: "1.2rem" }}>
                            <div className="atv2-level">Level: {level} ({groups[level].length})</div>
                            <div className="atv2-vgrid">
                                {groups[level].map(v => (
                                    <VideoCard
                                        key={v.id || v.s3_url || v.title}
                                        video={v}
                                        readOnly
                                        onPlay={() => { }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="atv2-empty">No videos</div>
                )}
            </div>
        </div>
    );
}
