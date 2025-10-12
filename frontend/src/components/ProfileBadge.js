import React from "react";
import { useNavigate, useLocation } from "react-router-dom";


const DEFAULT_AVATAR = "/user (1).png"; // ใช้ไฟล์ใน public เป็น default avatar

const ProfileBadge = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on login/register pages
  // Hide on login page only
  if (location.pathname === "/login") {
    return null;
  }

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const badgeStyle = {
    display: 'flex',
    alignItems: 'center',
    background: '#fafbfc',
    borderRadius: '999px',
    boxShadow: '0 1px 4px rgba(80, 80, 180, 0.06)',
    padding: '6px 18px 6px 10px',
    margin: '18px 24px 0 0',
    float: 'right',
    minWidth: 220,
    maxWidth: 320,
  };
  const avatarStyle = {
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: '2px solid #a259e6',
    objectFit: 'cover',
    marginRight: 14,
    background: '#fff',
  };
  const nameStyle = {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#333',
    marginRight: 18,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 120,
  };
  const logoutStyle = {
    background: '#f5f6fa',
    color: '#7b7b7b',
    border: 'none',
    borderRadius: '999px',
    padding: '7px 18px',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s',
  };
  const logoutHoverStyle = {
    background: '#e0e0e0',
  };

  return (
    <div style={badgeStyle}>
      <img
        src={user.avatar || DEFAULT_AVATAR}
        alt={user.name || "avatar"}
        style={avatarStyle}
      />
      <span style={nameStyle}>{user.name || user.email}</span>
      <button
        style={logoutStyle}
        onMouseOver={e => e.currentTarget.style.background = logoutHoverStyle.background}
        onMouseOut={e => e.currentTarget.style.background = logoutStyle.background}
        onClick={handleLogout}
      >
        ออกจากระบบ
      </button>
    </div>
  );
};

export default ProfileBadge;