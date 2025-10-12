
const iconStyle = { fontSize: 20, marginRight: 10, verticalAlign: 'middle' };

const UserActivityCard = ({ activity, cardHeight, style }) => (
  <div style={{
    background:'#fff',
    borderRadius:12,
    boxShadow:'0 2px 8px -2px #a855f722',
    padding:'1.5rem 1.25rem',
    minWidth:280,
    maxWidth:340,
    height: cardHeight === 'stretch' ? '100%' : undefined,
    ...style
  }}>
    <div style={{fontWeight:700,fontSize:'1.25rem',color:'#23272e',marginBottom:'1.25rem'}}>User Activity</div>
    <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#f1f8ff',borderRadius:12,padding:'0.85rem 1.25rem'}}>
        <span style={{display:'flex',alignItems:'center',color:'#2563eb',fontWeight:600,fontSize:'1.05rem'}}>
          {/* Outlined eye icon */}
          <svg style={iconStyle} width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.833 11C3.333 6.833 7.167 4.167 11 4.167c3.833 0 7.667 2.666 9.167 6.833-1.5 4.167-5.334 6.833-9.167 6.833-3.833 0-7.667-2.666-9.167-6.833Z" stroke="#2563eb" strokeWidth="1.5" fill="#f1f8ff"/><circle cx="11" cy="11" r="3" stroke="#2563eb" strokeWidth="1.5" fill="#fff"/><circle cx="11" cy="11" r="1.2" fill="#2563eb"/></svg>
          Document Views
        </span>
        <span style={{color:'#2563eb',fontWeight:700,fontSize:'1.15rem'}}>0</span>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#f1fcf6',borderRadius:12,padding:'0.85rem 1.25rem'}}>
        <span style={{display:'flex',alignItems:'center',color:'#22c55e',fontWeight:600,fontSize:'1.05rem'}}>
          {/* Download icon */}
          <svg style={iconStyle} width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="16" width="12" height="2" rx="1" fill="#22c55e"/><path d="M11 5v8.5M11 13.5l-3-3M11 13.5l3-3" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Downloads
        </span>
        <span style={{color:'#22c55e',fontWeight:700,fontSize:'1.15rem'}}>0</span>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#faf5ff',borderRadius:12,padding:'0.85rem 1.25rem'}}>
        <span style={{display:'flex',alignItems:'center',color:'#a855f7',fontWeight:600,fontSize:'1.05rem'}}>
          {/* Upload icon */}
          <svg style={iconStyle} width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="16" width="12" height="2" rx="1" fill="#a855f7"/><path d="M11 17V8.5M11 8.5l-3 3M11 8.5l3 3" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Shares
        </span>
        <span style={{color:'#a855f7',fontWeight:700,fontSize:'1.15rem'}}>0</span>
      </div>
    </div>
  </div>
);

export default UserActivityCard;
