// ...existing code from Dashboard.js...
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../components/Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
            return;
        }
        setUser(JSON.parse(userData));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>กำลังโหลด...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <nav className="dashboard-nav">
                <div className="dashboard-logo">FitAddict</div>
                <div className="dashboard-user">
                    {user.picture && (
                        <img src={user.picture} alt="Profile" className="user-avatar" />
                    )}
                    <span className="user-name" style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1e293b" }}>
                        {user.name}
                    </span>
                    <button
                        className="logout-btn"
                        style={{
                            marginLeft: "1.5rem",
                            background: "#f1f5f9",
                            color: "#64748b",
                            fontWeight: 500,
                            border: "none",
                            borderRadius: "100px",
                            padding: "0.5rem 1.25rem",
                            cursor: "pointer",
                            fontSize: "0.95rem",
                            transition: "all 0.3s"
                        }}
                        onClick={handleLogout}
                    >
                        ออกจากระบบ
                    </button>
                </div>
            </nav>
            {/* ...rest of Dashboard code... */}
        </div>
    );
};

export default Dashboard;
