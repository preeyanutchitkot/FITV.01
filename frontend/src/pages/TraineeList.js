import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';


function TraineeList() {
  const [trainees, setTrainees] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrainees = () => {
      fetch('http://localhost:8000/trainees')
        .then(res => res.json())
        .then(data => setTrainees(data));
    };
    fetchTrainees();
    const interval = setInterval(fetchTrainees, 10000);
    return () => clearInterval(interval);
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
      <h2>All Trainees</h2>
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
          {trainees.map((t) => (
            <tr key={t.id} style={{ cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.backgroundColor = trHoverStyle.backgroundColor} onMouseOut={e => e.currentTarget.style.backgroundColor = ''}>
              <td style={thtdStyle}>{t.id}</td>
              <td style={thtdStyle}>
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  {t.name || '-'}
                  {(() => { console.log('Trainee:', t.id, 'is_online:', t.is_online); return null; })()}
                  <span style={{
                    position: 'absolute',
                    right: -18,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: ((() => {
                      // Robust check: true, 'true', 1, '1', 'online', 'active', TRUE, etc.
                      if (t.is_online === true || t.is_online === 1) return '#22c55e';
                      if (typeof t.is_online === 'string') {
                        const v = t.is_online.trim().toLowerCase();
                        if (v === 'true' || v === '1' || v === 'online' || v === 'active') return '#22c55e';
                      }
                      if (typeof t.is_online === 'boolean' && t.is_online) return '#22c55e';
                      return '#cbd5e1';
                    })()),
                    border: '2px solid #fff',
                    display: 'inline-block',
                    transition: 'background 0.2s'
                  }}></span>
                </span>
              </td>
              <td style={thtdStyle}>{t.email || '-'}</td>
              <td style={thtdStyle}>
                <button
                  style={buttonStyle}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor}
                  onClick={() => navigate(`/trainees/${t.id}`)}
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

export default TraineeList;
