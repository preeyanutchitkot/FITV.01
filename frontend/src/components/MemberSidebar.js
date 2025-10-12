import React from 'react';
import InviteTrainee from './InviteTrainee';

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export default function MemberSidebar({
  profile,
  trainees = [],
  onInviteSuccess,
  onOpenMenu,     // (e, trainee) -> เปิดเมนู ⋮
  menuOpenNode,   // element เมนูที่วางจากหน้าพ่อ (เพื่อ overlay)
  hidden = false, // ใช้ใส่ class slide-out
}) {
  return (
    <aside className={`trainer-aside ${hidden ? 'trainer-aside--hidden' : ''}`}>
      <div className="trainer-aside__profile">
        <img 
          src={profile.picture || `${API_BASE}/profile-image/${profile.id}` || "/user (1).png"} 
          alt="avatar" 
          onError={(e) => { e.currentTarget.src = "/user (1).png"; }}
        />
        <div className="name">{profile.name}</div>
        <span className="dot-online" />
      </div>

      <hr className="divider" />

      <div className="trainer-aside__title">Memberlist ({trainees.length})</div>

      <InviteTrainee onSuccess={onInviteSuccess} />

      <div className="trainer-list__scroll">
        {trainees.length === 0 ? (
          <div className="muted">ยังไม่มีสมาชิกในทีม</div>
        ) : (
          trainees.map((t) => (
            <div key={t.id} className="trainee-row">
              <button
                className="trainee-row__main"
                onClick={() => window.location.assign(`/trainer/trainees/${t.id}`)}
              >
                <img 
                  className="trainee-row__avatar" 
                  src={t.profile_image || `${API_BASE}/profile-image/${t.id}`}
                  onError={(e) => { e.currentTarget.src = "/user (1).png"; }}
                  alt="" 
                />
                <div className="trainee-row__info">
                  <div className="trainee-row__name">{t.name || 'Unnamed'}</div>
                  <div className="trainee-row__email">{t.email}</div>
                </div>
                <span className="trainee-row__status" />
              </button>

              <button
                className="kebab"
                aria-haspopup="menu"
                onClick={(e) => onOpenMenu?.(e, t)}
              >
                ⋮
              </button>
            </div>
          ))
        )}
      </div>

      {/* ส่ง overlay จากพ่อมาวางในนี้ได้เลย */}
      {menuOpenNode}
    </aside>
  );
}
