// src/components/analytics/WeeklyFrequencyChart.js
import React, { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import * as d3 from "d3";

/*
  Props:
    data = [{ weekLabel: 'Week 1', value: 5 }, ...]
*/
export default function WeeklyFrequencyChart({ data = [] }) {
  const wrapRef = useRef(null);
  const [w, setW] = useState(0);

  // --- Observe width for responsiveness ---
  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;

    // ตั้งค่าเริ่มต้น
    const first = el.clientWidth || 360;
    setW(first);

    const ro = new ResizeObserver((entries) => {
      const nw = Math.round(entries[0].contentRect.width);
      setW((prev) => (prev !== nw ? nw : prev));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // --- Render chart whenever width or data changes ---
  useEffect(() => {
    if (!wrapRef.current || !w) return;
    const wrap = wrapRef.current;
    wrap.innerHTML = "";

    // ---- Card skeleton (title + canvas holder) ----
    const card = d3
      .select(wrap)
      .append("div")
      .style("background", "#fff")
      .style("border-radius", "20px")
      .style("padding", "16px")
      .style("box-shadow", "0 8px 24px rgba(2,6,23,0.06)");

    const title = card
      .append("div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "8px")
      .style("font-weight", 700)
      .style("color", "#0f172a")
      .style("margin-bottom", "35px"); // ระยะห่างหัวข้อ ↔ กราฟ

    // calendar icon
    // Icon container for lucide icon (rendered after effect via React portal-like approach not needed; directly append DOM)
    const iconHolder = title.append("span").style("display", "flex").style("align-items", "center");
    // We'll mount a placeholder element and let React render icon after by id
    const iconId = `wf-icon-${Math.random().toString(36).slice(2)}`;
    iconHolder.append("span").attr("id", iconId);
    title.append("span").text("Weekly Frequency");
    // After DOM built, inject icon via standard React render
    setTimeout(() => {
      const el = document.getElementById(iconId);
      if (el && !el.firstChild) {
        try { /* dynamic create */
          const root = document.createElement("span");
          el.appendChild(root);
          // Plain inline SVG since small: fallback if lucide not loaded
          root.innerHTML = `<svg width="16" height="16" stroke="#0f172a" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>`;
        } catch {}
      }
    }, 0);

    // holder จะกว้าง 100% ของ wrapRef
    const holder = card
      .append("div")
      .style("position", "relative")
      .style("width", "100%");

    // Responsive width: เผื่อ padding 16px ซ้าย/ขวา ของ card
    const W = Math.max(320, w - 32);
    const H = 170;
    const m = { top: 10, right: 16, bottom: 28, left: 28 };

    const svg = holder.append("svg").attr("width", W).attr("height", H);

    // ---- Scales ----
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.weekLabel))
      .range([m.left, W - m.right])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) || 1])
      .nice()
      .range([H - m.bottom, m.top]);

    // ---- Grid (light) ----
    svg
      .append("g")
      .attr("transform", `translate(${m.left},0)`)
      .call(d3.axisLeft(y).ticks(4).tickSize(-W + m.left + m.right))
      .call((g) => g.selectAll(".tick line").attr("stroke", "#e5e7eb"))
      .call((g) => g.selectAll(".domain").remove())
      .call((g) =>
        g.selectAll("text").style("font-size", "11px").style("fill", "#64748b")
      );

    // ---- X axis ----
    svg
      .append("g")
      .attr("transform", `translate(0,${H - m.bottom})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call((g) => g.selectAll(".domain").remove())
      .call((g) =>
        g.selectAll("text").style("font-size", "11px").style("fill", "#64748b")
      );

    // ---- Backplate (gray highlight behind hovered bar) ----
    const back = svg
      .append("rect")
      .attr("x", 0)
      .attr("y", m.top + 2)
      .attr("width", 0)
      .attr("height", H - m.bottom - m.top - 2)
      .attr("rx", 8)
      .attr("fill", "#e5e7eb")
      .attr("opacity", 0)
      .lower();

    // ---- Green gradient ----
    const defs = svg.append("defs");
    const grad = defs
      .append("linearGradient")
      .attr("id", "wf-grad")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    grad.append("stop").attr("offset", "0%").attr("stop-color", "#5ec584ff");
    grad.append("stop").attr("offset", "100%").attr("stop-color", "#5ec584ff");

    // ---- Bars ----
    const bars = svg
      .selectAll("rect.bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.weekLabel))
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(0) - y(d.value))
      .attr("rx", 8)
      .attr("fill", "url(#wf-grad)");

    // ---- Tooltip (HTML) ----
    const tooltip = holder
      .append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "#fff")
      .style("border-radius", "12px")
      .style("box-shadow", "0 8px 24px rgba(2,6,23,0.12)")
      .style("padding", "8px 10px")
      .style("font-size", "12px")
      .style("color", "#0f172a")
      .style("opacity", 0);

    const tLabel = tooltip
      .append("div")
      .style("font-weight", 700)
      .style("margin-bottom", "2px");
    const tRow = tooltip
      .append("div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "8px");
    tRow.append("span").text("Workouts").style("color", "#64748b");
    const tVal = tRow
      .append("span")
      .style("font-weight", 700)
      .style("min-width", "14px")
      .style("text-align", "right");

    // ---- Interactions ----
    const showTip = (event, d) => {
      // backplate
      back
        .attr("x", x(d.weekLabel))
        .attr("width", x.bandwidth())
        .attr("opacity", 0.35);

      // tooltip
      const cx = x(d.weekLabel) + x.bandwidth() / 2;
      const cy = y(d.value) - 10;

      tLabel.text(d.weekLabel);
      tVal.text(d.value);

      const node = tooltip.node();
      tooltip.style("opacity", 1);
      const bb = node.getBoundingClientRect();

      // position centered (ภายใน holder)
      const left = m.left + (cx - bb.width / 2);
      const top = Math.max(0, cy - bb.height - 8);

      tooltip.style("left", `${left}px`).style("top", `${top}px`);
    };

    const hideTip = () => {
      back.attr("opacity", 0);
      tooltip.style("opacity", 0);
    };

    bars.on("mouseenter", showTip).on("mousemove", showTip).on("mouseleave", hideTip);
  }, [data, w]);

  return <div ref={wrapRef} style={{ width: "100%" }} />;
}
