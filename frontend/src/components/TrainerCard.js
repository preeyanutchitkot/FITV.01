import React from 'react';


const TrainerCard = ({ trainer }) => (
  <div style={{display:'flex',alignItems:'center',gap:'1.25rem',background:'#fff',borderRadius:18,padding:'1.5rem 2rem',boxShadow:'0 2px 8px -2px #a855f722',marginBottom:'1.5rem'}}>
    <img
      src={trainer.picture || '/user (1).png'}
      alt="trainer"
      style={{width:64,height:64,borderRadius:'50%',objectFit:'cover',border:'2px solid #a855f7'}}
      onError={e => { e.target.onerror = null; e.target.src = '/user (1).png'; }}
    />
    <div>
      <div style={{fontWeight:700,fontSize:'1.25rem',color:'#334155'}}>{trainer.name}</div>
  <div style={{color:'#64748b',fontSize:'1rem'}}>{trainer.videos} Videos</div>
    </div>
  </div>
);

export default TrainerCard;
