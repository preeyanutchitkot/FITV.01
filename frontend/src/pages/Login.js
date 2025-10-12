import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import AuthHeader from '../components/auth/AuthHeader';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import AuthButton from '../components/auth/AuthButton';
import '../components/auth/Login.css';

const Login = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await response.json();
      if (!response.ok) {
        // handle uninvited
        if (response.status === 403 && (data.detail || '').includes('uninvited')) {
          navigate('/dashboard-uninvited');
          alert('คุณยังไม่ได้รับสิทธิ์ กรุณาติดต่อผู้ดูแลระบบ');
          setIsLoading(false);
          return;
        }
        throw new Error(data.detail || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      const role = data.user?.role;
      navigate(role === 'admin' ? '/admin' : role === 'trainer' ? '/trainer' : '/trainee');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (err) => {
    console.error(err);
    setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google');
  };

  return (
    <AuthLayout>
      <AuthHeader />
      <GoogleAuthButton
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        isLoading={isLoading}
      />
      <div className="login-divider">
        <span className="login-divider-line"></span>
        <span className="login-divider-label">Secure &amp; Fast</span>
        <span className="login-divider-line"></span>
      </div>
      <div className="login-footer-note">
        <img src="/Shield.png" alt="" aria-hidden="true" />
        <span>Secure authentication powered by Google</span>
      </div>
      {error && <div className="error-message">{typeof error === 'string' ? error : (error.message || 'เกิดข้อผิดพลาด')}</div>}
    </AuthLayout>
  );
};

export default Login;
