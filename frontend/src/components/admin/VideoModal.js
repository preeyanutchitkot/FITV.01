import React from "react";

export default function VideoModal({ open, title, src, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="ar-modal-backdrop" onClick={onClose} />
      <div className="ar-modal">
        <div className="ar-modal-header">
          <div className="ar-modal-title">{title || "Preview"}</div>
          <button className="btn btn-outline" onClick={onClose}>✕</button>
        </div>
        <video className="ar-modal-video" src={src} controls autoPlay />
      </div>
    </>
  );
}
