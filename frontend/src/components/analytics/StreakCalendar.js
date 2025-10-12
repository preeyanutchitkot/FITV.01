// src/components/analytics/StreakCalendar.js
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

/*
  Props:
    data: Array<{ date: Date|string, value: number }>
    variant?: "week" | "month"    // โฟกัสดีไซน์ "week"
*/
export default function StreakCalendar({ data = [], variant = "week" }) {
    const ref = useRef(null);
    const [w, setW] = useState(0);

    // ===== THEME =====
    const PAD = 20;                 // padding รอบการ์ด
    const CARD_RADIUS = 20;         // โค้งการ์ด
    const TITLE_SIZE = 14;
    const DAYLABEL_SIZE = 11;
    const NUMBER_SIZE = 12;
    const HEADER_H = 20;
    const DAYLABEL_H = 16;
    const LEGEND_H = 20;

    const COLORS = {
        cardBg: "#ffffff",
        title: "#0f172a",
        dayLabel: "#94a3b8",
        active: "#22C55E",
        rest: "#E5E7EB",
        restStroke: "#D1D5DB",
        legend: "#64748b",
        numberActive: "#ffffff",
        numberRest: "#475569",
        // layered drop-shadows for a softer realistic elevation
        shadow: "drop-shadow(0 6px 18px rgba(15,23,42,0.10)) drop-shadow(0 2px 6px rgba(15,23,42,0.06))",
        hoverActive: "#16a34a",
        hoverRest: "#e2e8f0",
        todayStroke: "#22c55e", // ถ้าอยากเน้นวันนี้ เพิ่ม stroke ได้
    };

    const asDate = (d) => (d instanceof Date ? d : new Date(d));
    const key = (d) => asDate(d).toISOString().slice(0, 10);
    const valueMap = new Map(data.map((d) => [key(asDate(d.date)), Number(d.value) || 0]));

    // ===== Observe width for responsiveness =====
    useEffect(() => {
        if (!ref.current) return;
        const el = ref.current;
        const ro = new ResizeObserver((entries) => {
            const nw = Math.round(entries[0].contentRect.width);
            if (nw !== w) setW(nw);
        });
        ro.observe(el);
        setW(el.clientWidth || 420);
        return () => ro.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!ref.current) return;
        const root = ref.current;
        root.innerHTML = "";

        // ===== สร้างช่วงวันแบบสัปดาห์เดียว (Mon..Sun) =====
        const today = new Date();
        const t = new Date(today);
        const mondayOffset = ((t.getDay() + 6) % 7); // Mon=0
        const start = new Date(t);
        start.setDate(t.getDate() - mondayOffset);
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });

        // ===== SIZING (auto-fit ไม่ให้ชนกัน) =====
        const CARD_W = w || 420;
        const innerW = CARD_W - PAD * 2;   // พื้นที่ภายในการ์ดที่ใช้วางวงกลม
        const prefCircle = 64;             // ขนาดวงกลมโดยประมาณที่อยากได้
        const minGap = 16;                  // ช่องว่างขั้นต่ำระหว่างวัน

        // 1) คำนวณขนาดวงกลมให้ไม่เกินพื้นที่ (เผื่อ gap ขั้นต่ำไว้ก่อน)
        const CIRCLE = Math.max(
            28,                               // กันไม่ให้เล็กเกินไป
            Math.min(prefCircle, Math.floor((innerW - minGap * 6) / 7))
        );
        // 2) หลังล็อกขนาดวงกลมแล้ว กระจายช่องว่างที่เหลือให้เท่าๆ กัน
        const GAP = Math.max(
            minGap,
            Math.floor((innerW - CIRCLE * 7) / 6)
        );

        const baseY = PAD + HEADER_H + 20;
        const CARD_H = PAD + HEADER_H + 8 + DAYLABEL_H + 10 + CIRCLE + 42 + LEGEND_H + PAD;

        // ===== DRAW =====
        const svg = d3.select(root)
            .append("svg")
            .attr("width", CARD_W)
            .attr("height", CARD_H)
            .style("position", "relative")
            .style("z-index", 1)
            .style("filter", COLORS.shadow);

        // พื้นหลังการ์ด
        const bg = svg.append("rect")
            .attr("x", 0).attr("y", 0)
            .attr("width", CARD_W).attr("height", CARD_H)
            .attr("rx", CARD_RADIUS)
            .attr("fill", COLORS.cardBg);

        // Header (inline lucide flame path + text so flame will not be covered by SVG stacking)
        const header = svg.append("g").attr("transform", `translate(${PAD},${PAD})`);
        const flame = header.append("g").attr("transform", "translate(0,0)");
        flame.append("path")
            .attr("d", "M8.5 14.5c-.5-2 .5-3.5 2-5-1 3 .5 4.5 1.5 5.5.8.8 1 1.6 1 2.5a4 4 0 1 1-8 0c0-1 .2-2 1-3 1-1 1.5-1.5 2.5-3.5")
            .attr("fill", "none")
            .attr("stroke", "#fb923c")
            .attr("stroke-width", 2)
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .attr("transform", "translate(-2,-4) scale(0.9)");
        header.append("text")
            .text("Daily Streak")
            .attr("x", 28).attr("y", 12)
            .attr("dominant-baseline", "middle")
            .style("fontWeight", 700)
            .style("fontSize", TITLE_SIZE)
            .style("fill", COLORS.title);

        // ป้ายวันด้านบน
        const dayNames = ["M", "T", "W", "T", "F", "S", "S"];
        const g = svg.append("g").attr("transform", `translate(${PAD},${baseY})`);
        g.selectAll(".day")
            .data(dayNames)
            .enter().append("text")
            .attr("x", (_, i) => i * (CIRCLE + GAP) + CIRCLE / 2)
            .attr("y", 10)
            .attr("text-anchor", "middle")
            .style("fontSize", DAYLABEL_SIZE)
            .style("fontWeight", 600)
            .style("fill", COLORS.dayLabel)
            .text((d) => d);

        // แถวหลัก
        const row = g.append("g").attr("transform", `translate(0, ${DAYLABEL_H + 8})`);

        // คำนวณกลุ่มวันที่ active ติดกัน -> pill เดียว
        const activeFlags = days.map(d => (valueMap.get(key(d)) || 0) > 0);
        const groups = [];
        let current = null;
        activeFlags.forEach((isActive, i) => {
            if (isActive) {
                if (!current) current = { start: i, end: i };
                else current.end = i;
            } else if (current) {
                groups.push(current); current = null;
            }
        });
        if (current) groups.push(current);

        // วาด pill สำหรับแต่ละกลุ่ม active
        const pills = row.selectAll(".pill")
            .data(groups)
            .enter().append("rect")
            .attr("class", "pill")
            .attr("x", d => d.start * (CIRCLE + GAP))
            .attr("y", 0)
            .attr("width", d => (d.end - d.start + 1) * CIRCLE + (d.end - d.start) * GAP)
            .attr("height", CIRCLE)
            .attr("rx", CIRCLE / 2)
            .attr("fill", COLORS.active);

        // วันที่ที่เป็น rest -> grey circle เฉพาะ index ไม่อยู่ในกลุ่ม
        const restIndices = days.map((_, i) => i).filter(i => !activeFlags[i]);
        const rests = row.selectAll(".rest")
            .data(restIndices)
            .enter().append("circle")
            .attr("class", "rest")
            .attr("cx", i => i * (CIRCLE + GAP) + CIRCLE / 2)
            .attr("cy", CIRCLE / 2)
            .attr("r", CIRCLE / 2)
            .attr("fill", COLORS.rest)
            .attr("stroke", COLORS.restStroke)
            .attr("stroke-width", 1);

        // Overlay layer สำหรับตัวเลข (ทุกวัน) เพื่อให้อยู่บนสุด
        const labelLayer = row.append("g").attr("class", "labels");
        labelLayer.selectAll("text")
            .data(days)
            .enter().append("text")
            .attr("x", (_, i) => i * (CIRCLE + GAP) + CIRCLE / 2)
            .attr("y", CIRCLE / 2 + 4)
            .attr("text-anchor", "middle")
            .style("fontSize", NUMBER_SIZE)
            .style("fontWeight", 700)
            .style("fill", (_, i) => activeFlags[i] ? COLORS.numberActive : COLORS.numberRest)
            .text(d => asDate(d).getDate())
            .style("pointer-events", "none");

        // Hover interactions: ใช้ transparent overlay ต่อวัน
        const hovers = row.selectAll(".hover-zone")
            .data(days)
            .enter().append("rect")
            .attr("class", "hover-zone")
            .attr("x", (_, i) => i * (CIRCLE + GAP))
            .attr("y", 0)
            .attr("width", CIRCLE)
            .attr("height", CIRCLE)
            .attr("rx", CIRCLE / 2)
            .attr("fill", "transparent")
            .style("cursor", "pointer")
            .on("mouseenter", function(_, d, i){
                const idx = days.indexOf(d);
                if (activeFlags[idx]) {
                    d3.select(this).attr("fill", COLORS.hoverActive).attr("opacity", 0.25);
                } else {
                    d3.select(this).attr("fill", COLORS.hoverRest).attr("opacity", 0.6);
                }
            })
            .on("mouseleave", function(){
                d3.select(this).attr("fill", "transparent").attr("opacity", 1);
            });

        // ===== Legend แบบ "สี่เหลี่ยมมนหม่น ๆ" =====
        const legend = svg.append("g").attr("transform", `translate(${PAD},${CARD_H - PAD - LEGEND_H})`);

        // Active
        legend.append("rect")
            .attr("x", 0).attr("y", 2)
            .attr("width", 12).attr("height", 12)
            .attr("rx", 6).attr("ry", 6)
            .attr("fill", COLORS.active);
        legend.append("text")
            .attr("x", 18).attr("y", 12).text("Active")
            .style("fontSize", 12).style("fill", COLORS.legend);

        // Rest
        legend.append("rect")
            .attr("x", 80).attr("y", 2)
            .attr("width", 12).attr("height", 12)
            .attr("rx", 6).attr("ry", 6)
            .attr("fill", COLORS.rest)
            .attr("stroke", COLORS.restStroke);
        legend.append("text")
            .attr("x", 98).attr("y", 12).text("Rest")
            .style("fontSize", 12).style("fill", COLORS.legend);

        // เผื่อคำนวณเพิ่มในอนาคต
        bg.attr("height", CARD_H);
    }, [w, data, variant]);

    return <div ref={ref} style={{ width: "100%" }} />;
}
