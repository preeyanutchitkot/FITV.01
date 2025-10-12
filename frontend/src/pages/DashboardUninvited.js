import React, { useEffect } from 'react';
import '../components/Dashboard.css';

const ADMIN_CONTACT = {
  email: 'admin@fitaddict.com',
  phone: '081-234-5678',
  inbox: 'm.me/fitaddict.admin' // ตัวอย่าง Facebook Messenger
};

const DashboardUninvited = () => {
  useEffect(() => {
    setTimeout(() => {
      alert('คุณยังไม่ได้รับสิทธิ์ กรุณาติดต่อผู้ดูแลระบบ');
    }, 500);
  }, []);

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="dashboard-logo">FitAddict</div>
        <div className="dashboard-user">
          <span className="user-name" style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1e293b" }}>
            Guest
          </span>
        </div>
      </nav>
      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <h1 style={{ color: '#e11d48' }}>คุณยังไม่ได้รับสิทธิ์เข้าใช้งาน</h1>
          <p>กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์การเข้าใช้งาน</p>
        </div>
        <div className="dashboard-stats">
          <div className="stat-card" style={{ background: '#fff7f7', border: '1px solid #fecaca' }}>
            <h3 style={{ color: '#e11d48' }}>
              <span className="material-icons" style={{ verticalAlign: 'middle' }}>report_problem</span>
              ติดต่อผู้ดูแลระบบ
            </h3>
            <ul style={{ fontSize: '1.1rem', margin: '1rem 0 0 0', color: '#b91c1c' }}>
              <li>Inbox: <a href={`https://${ADMIN_CONTACT.inbox}`} target="_blank" rel="noopener noreferrer">{ADMIN_CONTACT.inbox}</a></li>
              <li>Email: <a href={`mailto:${ADMIN_CONTACT.email}`}>{ADMIN_CONTACT.email}</a></li>
              <li>โทร: <a href={`tel:${ADMIN_CONTACT.phone}`}>{ADMIN_CONTACT.phone}</a></li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardUninvited;
