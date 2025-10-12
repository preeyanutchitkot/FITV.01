import React from "react";

export default function ReviewToolbar({
  q, setQ,
  level, setLevel, levelOptions = [],
  sortBy, setSortBy,
  order, toggleOrder,
  onReload
}) {
  return (
    <div className="ar-toolbar">
      <input
        className="ar-input"
        placeholder="Search title or trainer id…"
        value={q}
        onChange={(e)=>setQ(e.target.value)}
      />
      <label className="ar-label">Level</label>
      <select className="ar-select" value={level} onChange={(e)=>setLevel(e.target.value)}>
        <option value="all">All</option>
        {levelOptions.map(lv => <option key={lv} value={lv}>{lv}</option>)}
      </select>

      <label className="ar-label">Sort</label>
      <select className="ar-select" value={sortBy} onChange={(e)=>setSortBy(e.target.value)}>
        <option value="created">Newest</option>
        <option value="title">Title</option>
        <option value="trainer">Trainer ID</option>
      </select>

      <button className="btn btn-outline" title="Toggle order" onClick={toggleOrder}>
        {order === "asc" ? "↑" : "↓"}
      </button>

      <button className="btn" onClick={onReload}>Reload</button>
    </div>
  );
}
