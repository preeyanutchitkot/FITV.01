import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';


function TraineeProfile() {
  const { id } = useParams();
  const [trainee, setTrainee] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:8000/trainees/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Trainee not found');
        return res.json();
      })
      .then((data) => setTrainee(data))
      .catch((err) => setError(err.message || 'เกิดข้อผิดพลาด'));
  }, [id]);

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f6f8fb',
  };
  const cardStyle = {
    background: '#fff',
    borderRadius: 18,
    boxShadow: '0 2px 18px 0 rgba(41, 56, 90, 0.11), 0 1.5px 6px 0 rgba(41, 56, 90, 0.07)',
    padding: '2.5rem 2.8rem 2rem 2.8rem',
    maxWidth: 380,
    width: '100%',
    textAlign: 'center',
    transition: 'box-shadow 0.2s',
  };
  const h2Style = {
    fontSize: '2rem',
    marginBottom: '1.5rem',
    color: '#222',
    fontWeight: 700,
  };
  const infoStyle = {
    textAlign: 'left',
    marginBottom: '2rem',
  };
  const infoPStyle = {
    margin: '0.5rem 0',
    fontSize: '1.1rem',
    color: '#434c63',
  };
  const infoStrongStyle = {
    color: '#6b47dc',
    fontWeight: 600,
    minWidth: 85,
    display: 'inline-block',
  };
  const backBtnStyle = {
    background: '#6b47dc',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '0.7rem 1.8rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  };
  const backBtnHoverStyle = {
    background: '#5335bb',
  };

  if (error) return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <p style={{ color: 'red' }}>{typeof error === 'string' ? error : (error.message || 'เกิดข้อผิดพลาด')}</p>
        <button
          style={backBtnStyle}
          onMouseOver={e => e.currentTarget.style.background = backBtnHoverStyle.background}
          onMouseOut={e => e.currentTarget.style.background = backBtnStyle.background}
          onClick={() => navigate(-1)}
        >Back</button>
      </div>
    </div>
  );

  if (!trainee) return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <p>Loading...</p>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={h2Style}>Trainee Profile</h2>
        <div style={infoStyle}>
          <p style={infoPStyle}><strong style={infoStrongStyle}>ID:</strong> {trainee.id}</p>
          <p style={infoPStyle}><strong style={infoStrongStyle}>Name:</strong> {trainee.name || 'No name'}</p>
          <p style={infoPStyle}><strong style={infoStrongStyle}>Points:</strong> {trainee.points}</p>
          <p style={infoPStyle}><strong style={infoStrongStyle}>Streak:</strong> {trainee.streak}</p>
        </div>
        <button
          style={backBtnStyle}
          onMouseOver={e => e.currentTarget.style.background = backBtnHoverStyle.background}
          onMouseOut={e => e.currentTarget.style.background = backBtnStyle.background}
          onClick={() => navigate(-1)}
        >Back</button>
      </div>
    </div>
  );
}

export default TraineeProfile;
