import React from 'react';
import './Auth.css';

const AuthLayout = ({ children }) => {
    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-content">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout; 