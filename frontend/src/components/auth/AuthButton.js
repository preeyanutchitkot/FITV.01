import React from 'react';

const AuthButton = ({ 
    type = 'button',
    variant = 'primary',
    onClick,
    disabled,
    children
}) => {
    const className = variant === 'primary' ? 'auth-button' : 'auth-button-secondary';

    return (
        <button 
            type={type}
            onClick={onClick}
            className={className}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

export default AuthButton; 