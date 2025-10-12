import React, { useState, useRef } from 'react';

const VideoCard = ({ video, onPlay, cardHeight, cardMargin, onDelete, readOnly = false, onCardClick }) => {
  // DEBUG: log video prop to check duration
  console.log('VideoCard video:', video);
  // Status color and dot
    // Status image mapping (images should be in public/ as status-<status>.png)
    // Status color and dot mapping for UI
    // Colors and style based on the provided sample image
    const statusColorMap = {
  Active: { bg: '#22C55E', dot: '#22C55E', color: '#fff' },
  Rejected: { bg: '#dc2626', dot: '#fff', color: '#fff' },
    Pending: { bg: '#FF9100', dot: '#FF9100', color: '#fff' }, // orange
    Pass: { bg: '#FF9100', dot: '#fff', color: '#fff' },
    Hide: { bg: '#BDBDBD', dot: '#fff', color: '#fff' },
    'Try Again': { bg: '#7C3AED', dot: '#fff', color: '#fff' },
    'Not Started': { bg: '#E0E0E0', dot: '#fff', color: '#888' },
  Verifying: { bg: '#fb923c', dot: '#fff', color: '#fff' },
    Draft: { bg: '#f3f4f6', dot: '#23272e', color: '#23272e' },
    };

    // Status style mapping (for background, color, border, etc.)
    const statusStyleMap = {
    'Try Again': { bg: '#f3e8ff', color: '#7c3aed', border: 'none' },
    'Pass': { bg: '#fff7ed', color: '#fb923c', border: 'none' },
  'Active': { bg: '#ecfdf5', color: '#22c55e', border: 'none' },
  'Rejected': { bg: '#fee2e2', color: '#dc2626', border: 'none' },
    'Pending': { bg: '#fff7ed', color: '#fb923c', border: 'none' }, // orange bg
    'Hide': { bg: '#f3f4f6', color: '#23272e', border: 'none' },
    'Not Started': { bg: '#f3f4f6', color: '#23272e', border: 'none' },
  'Verifying': { bg: '#fb923c', color: '#fff', border: 'none' },
    'Draft': { bg: '#f3f4f6', color: '#23272e', border: 'none' },
    };
  const status = video.statusBtn;
  // removed unused 'style' variable to fix eslint warning
  const isLocked = status === 'Locked';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  // determine current user role from localStorage (set by auth flow)
  let role = undefined;
  try {
    const u = localStorage.getItem('user');
    role = u ? JSON.parse(u)?.role : undefined;
  } catch {}
  const canDelete = !readOnly && role === 'trainer' && typeof onDelete === 'function';

  // ปิดเมนูเมื่อคลิกข้างนอก
  React.useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div style={{
      background:'#fff',
      borderRadius:20,
      boxShadow:'0 2px 16px rgba(0,0,0,0.09)',
      padding:'1.2rem 1.5rem',
      display:'flex',
      flexDirection:'column',
      alignItems:'flex-start',
      minWidth:260,
      maxWidth:340,
      width:'100%',
      margin: typeof cardMargin === 'number' ? `${cardMargin}px` : '0',
      position: 'relative',
      boxSizing: 'border-box',
      gap: '0.7rem',
    }}>
      {isLocked && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255,255,255,0.82)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 18,
          zIndex: 2,
          flexDirection: 'column',
        }}>
          <img src={process.env.PUBLIC_URL + '/lock-icon.svg'} alt="locked" style={{width:48,height:48,marginBottom:8,opacity:0.95}} />
          <span style={{color:'#64748b',fontWeight:700,fontSize:18,letterSpacing:0.5}}>Locked</span>
        </div>
      )}
      {video.image && (video.image.match(/\.(mp4|webm|ogg|mov)$/i) || video.image.includes('static/')) ? (
        <>
          {console.log('VideoCard - Rendering video:', video.title, 'URL:', video.image)}
          <div style={{
            width:'100%',
            aspectRatio:'1/1',
            background:'#fff',
            borderRadius:16,
            marginBottom:'0.7rem',
            display:'flex',
            justifyContent:'center',
            alignItems:'center',
            overflow:'hidden',
            position:'relative',
            maxWidth:'300px',
            minHeight:'260px',
          }}>
            <video
              src={video.image || video.s3_url}
              style={{
                width:'100%',
                height:'100%',
                objectFit:'contain', // เห็นวิดีโอเต็ม ส่วนขาดเป็นขาว
                background:'#fff', // สีขาวสำหรับขอบ
                borderRadius:16,
                aspectRatio:'1/1',
                position:'relative',
                display:'block'
              }}
              controls={false}
              muted
              preload="metadata"
              onMouseOver={e => {
                const playPromise = e.target.play();
                if (playPromise !== undefined) {
                  playPromise.catch(() => {});
                }
              }}
              onMouseOut={e => {
                e.target.pause();
                e.target.currentTime = 0;
              }}
              onError={e => {
                console.error('Video load error for:', video.title, 'URL:', e.target.src, 'Error:', e);
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
              onLoadStart={e => {
                console.log('Video load started for:', video.title, 'URL:', e.target.src);
              }}
              onCanPlay={e => {
                console.log('Video can play:', video.title);
              }}
            />
          </div>
          <div className="video-fallback" style={{display:'none',width:'100%',height:'100%',background:'#eee',borderRadius:16,marginBottom:'0.7rem',alignItems:'center',justifyContent:'center',color:'#888',fontWeight:600,fontSize:'0.98rem'}}>
            ไม่สามารถแสดงวิดีโอได้
          </div>
        </>
      ) : (
        <div style={{
          width:'100%',
          aspectRatio:'1/1',
          borderRadius:16,
          marginBottom:'0.7rem',
          overflow:'hidden',
          position:'relative',
          maxWidth:'340px',
        }}>
          <img src={encodeURI(video.image)} alt={video.title} style={{
            width:'100%',
            height:'100%',
            objectFit:'cover',
            borderRadius:16,
            aspectRatio:'1/1',
            position:'relative',
          }} />
        </div>
      )}
  <div style={{
    fontWeight:700,
    fontSize:'1.02rem',
    color:'#23272e',
    marginBottom:'0.22rem',
    display:'flex',
    alignItems:'center',
    width:'100%',
    justifyContent:'flex-start',
    position:'relative',
    wordBreak:'break-word',
  }}>
    <span>{video.title}</span>
    {canDelete && (
      <>
        <span
          style={{
            fontSize:'1.5rem',
            color:'#23272e',
            cursor:'pointer',
            padding:'0 0.25rem',
            userSelect:'none',
            position:'absolute',
            right:0,
            top:0,
          }}
          onClick={e => { e.stopPropagation(); setMenuOpen(m => !m); }}
          title="More"
        >
          ⋮
        </span>
        {menuOpen && (
          <div ref={menuRef} style={{position:'absolute',top:32,right:0,background:'#fff',border:'1px solid #e5e7eb',borderRadius:8,boxShadow:'0 2px 8px #0001',zIndex:10,minWidth:110}}>
            <button
              style={{width:'100%',padding:'10px 18px',background:'none',border:'none',color:'#ef4444',fontWeight:700,cursor:'pointer',textAlign:'left',borderRadius:8}}
              onClick={() => {
                setMenuOpen(false);
                if (window.confirm('ต้องการลบวิดีโอนี้จริงหรือไม่?')) {
                  onDelete(video.id);
                }
              }}
            >
              ลบวิดีโอ
            </button>
          </div>
        )}
      </>
    )}
  </div>
  <div style={{fontSize:'0.92rem',color:'#23272e',display:'flex',gap:'0.5rem',marginBottom:'0.12rem',fontWeight:500, justifyContent:'flex-start'}}>
        <span style={{display:'flex',alignItems:'center',gap:4}}>
          <img src={process.env.PUBLIC_URL + '/Clock.png'} alt="clock" style={{width:17,height:17,marginRight:3,verticalAlign:'middle'}} />
          <span style={{color:'#7c3aed'}}>
            {(() => {
              const durationSec = Number(video.duration);
              if (isNaN(durationSec) || durationSec <= 0) return '0 ว.';
              if (durationSec < 60) return `${durationSec} ว.`;
              const minutes = Math.floor(durationSec / 60);
              const seconds = durationSec % 60;
              if (seconds === 0) return `${minutes} นาที`;
              return `${minutes} นาที ${seconds} ว.`;
            })()}
          </span>
        </span>
        <span style={{display:'flex',alignItems:'center',gap:4}}>
          <img src={process.env.PUBLIC_URL + '/FireSimple.png'} alt="fire" style={{width:17,height:17,marginRight:3,verticalAlign:'middle'}} />
          <span style={{color:'#fb923c'}}>{typeof video.kcal === 'number' && !isNaN(video.kcal) ? video.kcal : (video.kcal ? video.kcal : '-')} Kcal</span>
        </span>
      </div>
  <div style={{color:'#23272e',fontSize:'0.92rem',marginBottom:'0.12rem', textAlign:'left'}}>Score: <span style={{fontWeight:700}}>{video.score ?? '-'}%</span></div>
      {status && (() => {
  const style = statusColorMap[status] || { bg: '#E0E0E0', dot: '#fff', color: '#888' };
  // เพิ่มให้ badge Draft กดเข้าแก้ไขได้
  const handleDraftClick = (e) => {
    if (status === 'Draft' || status === 'Rejected') {
      e.stopPropagation();
      if (typeof onCardClick === 'function') {
        onCardClick();
      } else {
        window.location.href = `/trainer/upload?id=${video.id}`;
      }
    }
  };
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        background: style.bg,
        color: style.color,
        fontWeight: 700,
        borderRadius: 8,
        padding: '0.18rem 0.8rem',
        fontSize: '0.98rem',
        marginBottom: '0.7rem',
        border: style.border || 'none',
        minWidth: 48,
        justifyContent: 'flex-start',
        gap: '0.5rem',
        boxShadow: 'none',
        letterSpacing: 0.2,
        lineHeight: 1.1,
        cursor: (status === 'Draft' || status === 'Rejected') ? 'pointer' : 'default',
      }}
      onClick={handleDraftClick}
      title={status === 'Draft'
        ? 'แก้ไข Draft นี้'
        : (status === 'Rejected'
            ? (video.reject_reason ? `ถูก Reject: ${video.reject_reason}` : 'วิดีโอถูก Reject คลิกเพื่อแก้ไข/อัปโหลดใหม่')
            : '')}
    >
      <span style={{
        display: 'inline-block',
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: '#fff',
        marginRight: 2,
        verticalAlign: 'middle',
        border: status === 'Pending' ? 'none' : 'none',
      }} />
      <span style={{ fontWeight: 700 }}>{status}</span>
    </span>
  );
})()}
      <button
        onClick={onPlay}
        disabled={isLocked}
        style={{
          width:'100%',
          background:'linear-gradient(90deg,#fb6600 0%, #ff4d8b 50%, #a855f7 80%, #4f46e5 100%)',
          color:'#fff',
          fontWeight:700,
          border:'none',
          borderRadius:10,
          padding:'0.48rem 0',
          fontSize:'1.02rem',
          marginTop:'0.32rem',
          cursor: isLocked ? 'not-allowed' : 'pointer',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          gap:6,
          opacity: isLocked ? 0.5 : 1
        }}
      >
        <svg width="22" height="22" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight:6}}>
          <path d="M10 7
            Q10 7 10 19
            Q10 31 10 31
            Q12 33 15 31
            L30 21
            Q33 19 30 17
            L15 7
            Q12 5 10 7
            Z" fill="#fff" />
        </svg>
        <span style={{fontWeight:700, fontSize:'1.02rem'}}>Play</span>
      </button>
    </div>
  );
};

export default VideoCard;
