// src/components/analytics/CurrentStatsCard.js
import React, { useEffect, useState } from "react";
import { Star, Flame, Target } from "lucide-react";

/*
  Props (mock ตอนนี้ แต่เตรียมต่อจริงแล้ว):
    - streakDays?: number
    - avgScore?: number (0-100)
    - autoFetch?: boolean            // true แล้วจะลอง fetch endpoint ด้านล่าง
    - endpoint?: string              // e.g. '/api/analytics/current'
*/
export default function CurrentStatsCard({
  streakDays: streakDaysProp,
  avgScore: avgScoreProp,
  autoFetch = false,
  endpoint = "/api/analytics/current",
}) {
  // ---- mock state (ค่าเริ่มต้น) ----
  const [streakDays, setStreakDays] = useState(streakDaysProp ?? 8);
  const [avgScore, setAvgScore] = useState(avgScoreProp ?? 87);
  const [loading, setLoading] = useState(false);

  // ---- เตรียมต่อข้อมูลจริง ----
  useEffect(() => {
    if (!autoFetch) return;

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(endpoint, {
          headers: { "Content-Type": "application/json" },
          // ถ้ามี token:
          // headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // คาดรูปแบบตอบกลับ (ตัวอย่าง):
        // { current_streak_days: number, average_score: number }
        if (!alive) return;
        setStreakDays(Number(json.current_streak_days ?? streakDays));
        setAvgScore(Number(json.average_score ?? avgScore));
      } catch (e) {
        // เงียบ ๆ หรือแสดง fallback ก็ได้
        console.warn("CurrentStatsCard fetch failed:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [autoFetch, endpoint]);

  const Row = ({ label, value, color, gradient, icon }) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 8,
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 14,
        background: gradient, // ไล่เฉดอ่อน ๆ ตามภาพตัวอย่าง
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          {label}
        </span>
        <span style={{ fontWeight: 800, fontSize: "1.3rem", color }}>
          {value}
        </span>
      </div>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          background: "#ffffffaa",
          backdropFilter: "blur(2px)",
        }}
        aria-hidden
      >
        {icon}
      </div>
    </div>
  );

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: "16px 18px",
        boxShadow: "0 8px 24px rgba(2,6,23,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontWeight: 800,
          fontSize: "1.05rem",
          color: "#0f172a",
        }}
      >
        <Star size={16} color="#f59e0b" />
        <span>Current Stats</span>
      </div>

      {/* Streak */}
      <Row
        label="Current Streak"
        value={`${streakDays}${loading ? "…" : " days"}`}
        color="#fb923c"
        gradient="linear-gradient(90deg, rgba(255,237,213,0.45) 0%, rgba(255,255,255,0.9) 65%)"
        icon={<Flame size={16} color="#fb923c" />}
      />

      {/* Divider */}
      <div style={{ height: 1, background: "#e5e7eb", margin: "2px 0" }} />

      {/* Average Score */}
      <Row
        label="Average Score"
        value={`${avgScore}${loading ? "…" : "%"}`}
        color="#16a34a"
        gradient="linear-gradient(90deg, rgba(209,250,229,0.50) 0%, rgba(255,255,255,0.95) 65%)"
        icon={<Target size={16} color="#16a34a" />}
      />
    </div>
  );
}
