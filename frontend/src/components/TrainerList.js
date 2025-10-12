import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';


function TrainerList() {
  const [trainers, setTrainers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8000/trainers')
      .then(res => res.json())
      .then(data => setTrainers(data));
  }, []);

  const containerStyle = { padding: 30, fontFamily: 'Arial, sans-serif' };
  const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 20 };
  const thtdStyle = { padding: '12px 15px', border: '1px solid #ddd', textAlign: 'left' };
  const thStyle = { ...thtdStyle, backgroundColor: '#f2f2f2' };
  const trHoverStyle = { backgroundColor: '#f9f9f9' };
  const buttonStyle = { padding: '6px 12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' };
  const buttonHoverStyle = { backgroundColor: '#45a049' };

  return (
    <div style={containerStyle}>
      <h2>All Trainers</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Profile</th>
          </tr>
        </thead>
        <tbody>
          {trainers.map((t) => (
            <tr key={t.id} style={{ cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.backgroundColor = trHoverStyle.backgroundColor} onMouseOut={e => e.currentTarget.style.backgroundColor = ''}>
              <td style={thtdStyle}>{t.id}</td>
              <td style={thtdStyle}>{t.name || '-'}</td>
              <td style={thtdStyle}>{t.email || '-'}</td>
              <td style={thtdStyle}>
                <button
                  style={buttonStyle}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor}
                  onClick={() => navigate(`/trainers/${t.id}`)}
                >
                  View Profile
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TrainerList;
