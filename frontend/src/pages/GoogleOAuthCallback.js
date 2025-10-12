import React from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from '../utils/jwtDecode';

function GoogleOAuthCallback() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleOAuthCallback = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        
        if (token) {
          // เก็บ token
          localStorage.setItem('token', token);
          
          // decode JWT
          const payload = jwtDecode(token);
          if (payload) {
            // เก็บข้อมูล user
            localStorage.setItem('user', JSON.stringify({
              email: payload.email,
              role: payload.role,
              name: payload.name || '',
            }));
            
            // redirect ตาม role
            switch (payload.role) {
              case 'trainee':
                navigate('/trainee');
                break;
              case 'trainer':
                navigate('/trainer');
                break;
              case 'admin':
                navigate('/admin');
                break;
              default:
                navigate('/home');
            }
          } else {
            console.error('Invalid token payload');
            navigate('/home');
          }
        } else {
          console.error('No token found in URL');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  return (
    <div style={{textAlign: 'center', marginTop: '50px'}}>
      กำลังเข้าสู่ระบบด้วย Google...
    </div>
  );
}

export default GoogleOAuthCallback;