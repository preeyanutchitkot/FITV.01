import React from 'react';

const SocialLogin = ({ onClick, isLoading, type = 'login' }) => {
    const buttonText = type === 'login' ? 'เข้าสู่ระบบด้วย Google' : 'สมัครสมาชิกด้วย Google';

    return (
        <>
            <button 
                onClick={onClick} 
                className="social-login-button"
                disabled={isLoading}
            >
                <img 
                    src={process.env.PUBLIC_URL + '/Google.png'} 
                    alt="Google" 
                />
                {buttonText}
            </button>

            <div className="auth-divider">
                <span>
                    {type === 'login' 
                        ? 'หรือเข้าสู่ระบบด้วยอีเมล'
                        : 'หรือสมัครสมาชิกด้วยอีเมล'
                    }
                </span>
            </div>
        </>
    );
};

export default SocialLogin; 