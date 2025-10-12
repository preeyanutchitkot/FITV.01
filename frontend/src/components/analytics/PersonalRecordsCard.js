// src/components/analytics/PersonalRecordsCard.js
import React, { useEffect, useState } from "react";
import { Medal, TrendingUp, Clock3, Activity } from "lucide-react";

/*
  Props:
    maxStreak?: number                // mock ค่าเริ่มต้น
    longestWorkout?: string|number    // "mm:ss" หรือ seconds (number)
    totalWorkouts?: number
    autoFetch?: boolean               // เปิดแล้วจะ fetch endpoint
    endpoint?: string                 // เอนด์พอยท์ที่คืนค่ารูปแบบด้านล่าง

  รูปแบบที่คาดจาก backend:
    GET /api/analytics/records
    {
      "max_streak_days": 12,
      "longest_workout_seconds": 2535,   // 42:15
      "total_workouts": 47
    }
*/

export default function PersonalRecordsCard({
  maxStreak: maxStreakProp = 12,
  longestWorkout: longestWorkoutProp = "42:15",
  totalWorkouts: totalWorkoutsProp = 47,
  autoFetch = false,
  endpoint = "/api/analytics/records",
}) {
  const [maxStreak, setMaxStreak] = useState(maxStreakProp);
  const [longestWorkout, setLongestWorkout] = useState(formatDuration(longestWorkoutProp));
  const [totalWorkouts, setTotalWorkouts] = useState(totalWorkoutsProp);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!autoFetch) return;
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(endpoint, {
          headers: {
            "Content-Type": "application/json",
            // ถ้ามี token:
            // Authorization: `Bearer ${localStorage.getItem('token')}`
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (!alive) return;
        setMaxStreak(Number(json.max_streak_days ?? maxStreakProp));
        setLongestWorkout(formatDuration(json.longest_workout_seconds ?? longestWorkoutProp));
        setTotalWorkouts(Number(json.total_workouts ?? totalWorkoutsProp));
      } catch (e) {
        console.warn("PersonalRecordsCard fetch failed:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [autoFetch, endpoint]);

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
      {/* Title */}
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
        <Medal size={16} color="#6366f1" />
        <span>Personal Records</span>
      </div>

      {/* Row: Max Streak (purple gradient chip) */}
      <ChipRow
        label="Max Streak"
        value={`${maxStreak}${loading ? "…" : " days"}`}
        gradient="linear-gradient(90deg, rgba(221,214,254,0.8) 0%, rgba(236,254,255,0.6) 100%)"
        labelColor="#7c3aed"
        valueColor="#7c3aed"
        icon={<TrendingUp size={16} color="#7c3aed" />}
      />

      {/* Row: Longest Workout (blue gradient chip) */}
      <ChipRow
        label="Longest Workout"
        value={`${longestWorkout}${loading ? "…" : ""}`}
        gradient="linear-gradient(90deg, rgba(191,219,254,0.7) 0%, rgba(224,242,254,0.7) 100%)"
        labelColor="#0ea5e9"
        valueColor="#0ea5e9"
        icon={<Clock3 size={16} color="#0ea5e9" />}
      />

      {/* Row: Total Workouts (plain) */}
      <PlainRow
        label="Total Workouts"
        value={`${totalWorkouts}${loading ? "…" : ""}`}
        icon={<Activity size={16} color="#94a3b8" />}
      />
    </div>
  );
}

/* ---------- Small presentational parts ---------- */

function ChipRow({ label, value, gradient, labelColor, valueColor, icon }) {
  return (
    <div
      style={{
        background: gradient,
        borderRadius: 16,
        padding: "10px 12px",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: labelColor }}>{label}</span>
        <span style={{ fontSize: "1.15rem", fontWeight: 800, color: valueColor }}>{value}</span>
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
}

function PlainRow({ label, value, icon }) {
  return (
    <div
      style={{
        padding: "6px 2px",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{label}</span>
        <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{value}</span>
      </div>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          background: "#f1f5f9",
        }}
        aria-hidden
      >
        {icon}
      </div>
    </div>
  );
}

/* ---------- Tiny inline icons (no deps) ---------- */

// (Removed custom inline SVG icon components replaced by lucide-react icons)

/* ---------- Utils ---------- */

function formatDuration(v) {
  // รับ "mm:ss" หรือ seconds (number) -> คืน "mm:ss"
  if (typeof v === "string" && v.includes(":")) return v;
  const sec = Number(v) || 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
