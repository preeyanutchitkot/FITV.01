import React from 'react';
import { useNavigate } from 'react-router-dom';

const AuthHeader = () => (
        <div className="auth-header" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
            <img
                src={process.env.PUBLIC_URL + '/Logo_FitAddicttest.png'}
                alt="FitAddict Logo"
                style={{width:64, height:64, objectFit:'contain', marginBottom:18, borderRadius:16, boxShadow:'0 2px 12px 0 #a855f722'}}
            />
            <div style={{fontWeight:600, fontSize:'1.25rem', color:'#23272e', marginBottom:8, textAlign:'center'}}>Sign In</div>
            <div style={{fontSize:'0.82rem', color:'#6b7280', textAlign:'center', marginBottom:18, marginTop:0, lineHeight:1.5, maxWidth:'30em', marginLeft:'auto', marginRight:'auto'}}>Sign In with your Google account to access FueRify’s powerful features</div>
        </div>
);

export default AuthHeader; 