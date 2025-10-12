// src/components/AdminPageHeader.js
import React, { useState, useRef, useEffect } from "react";
import "./AdminPageHeader.css";

export default function AdminPageHeader({ avatar, title, points, onBack, menuItems = [] }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (!btnRef.current || btnRef.current.contains(e.target)) return;
      setOpen(false);
    };
    window.addEventListener("click", close);
    window.addEventListener("keydown", (ev) => ev.key === "Escape" && setOpen(false));
    return () => {
      window.removeEventListener("click", close);
    };
  }, []);

  return (
    <div className="aph-topbar">
      <button className="aph-back" onClick={onBack}>← Back</button>
      <img className="aph-avatar" src={avatar} alt="avatar" />
      <div className="aph-title">{title}</div>
      {typeof points !== "undefined" && (
        <span className="aph-points">{points}pts</span>
      )}
      <div className="aph-spacer" />
      <button className="aph-kebab" ref={btnRef} onClick={() => setOpen(v => !v)} title="More">
        ⋮
      </button>
      {open && (
        <div className="aph-menu">
          {menuItems.length === 0 ? (
            <div className="aph-menu-item aph-menu-item--disabled">No actions</div>
          ) : menuItems.map((it, i) => (
            <button key={i} className="aph-menu-item" onClick={() => { setOpen(false); it.onClick?.(); }}>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
