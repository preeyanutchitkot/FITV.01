
import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
	const navigate = useNavigate();
	return (
		<div className="fitaddict-bg">
			<nav className="fitaddict-navbar">
				<div className="fitaddict-logo">FitAddict</div>
				<ul className="fitaddict-navlinks">
					<li><a href="/admin">Dashboard</a></li>
					<li><a className="active" href="/admin/users">Users</a></li>
					<li><a href="#settings">Settings</a></li>
					<li><button onClick={() => navigate('/')} className="nav-auth-btn">Home</button></li>
					<li><button onClick={() => navigate('/admin/login')} className="nav-auth-btn" style={{ background: '#a855f7', color: '#fff', marginLeft: 8 }}>Logout</button></li>
				</ul>
			</nav>
			<main className="fitaddict-main">
				<section className="fitaddict-hero" style={{ paddingTop: '2.5rem' }}>
					<h1>Admin <span>Dashboard</span></h1>
					<p style={{ fontSize: '1.15rem', color: '#334155', marginBottom: '1.5rem' }}>ยินดีต้อนรับสู่หน้าแดชบอร์ดผู้ดูแลระบบ<br />(เพิ่มเนื้อหา/เมนู admin ได้ตามต้องการ)</p>
					<div className="fitaddict-features-list" style={{ justifyContent: 'center' }}>
						<div className="fitaddict-feature-card"
							style={{ minWidth: 220 }}
							onClick={() => navigate('/admin/users')}
						>
							<h3>Manage Users</h3>
							<p>ดูและจัดการผู้ใช้ทั้งหมดในระบบ</p>
						</div>
						<div className="fitaddict-feature-card"
							style={{ minWidth: 220 }}
							onClick={() => navigate('/admin/review-videos')}>

							<h3>Video Library</h3>
							<p>ตรวจสอบและอัปโหลดวิดีโอใหม่</p>
						</div>
						<div className="fitaddict-feature-card" style={{ minWidth: 220 }}
							
						>
							<h3>Settings</h3>
							<p>ปรับแต่งการตั้งค่าระบบ</p>
						</div>
					</div>
				</section>
			</main>
			<footer className="fitaddict-footer">
				&copy; {new Date().getFullYear()} FitAddict. All rights reserved.
			</footer>
		</div>
	);
};

export default AdminDashboard;
