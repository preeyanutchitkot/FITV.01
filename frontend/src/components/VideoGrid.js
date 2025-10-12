import React from 'react';
import VideoCard from './VideoCard';

export default function VideoGrid({
  videos = [],
  onUpload,
  onDeleteVideo,
  onCardClick,
  onExpand,     // <- เรียกเมื่อกด "More"
  isFull = false
}) {
  return (
    <main className={`trainer-main ${isFull ? 'trainer-main--full' : ''}`}>
      <div className="trainer-main__head">
        <div className="trainer-main__title">Videolist ({videos.length})</div>
        <button className="btn-upload" onClick={onUpload}>
          <img src={process.env.PUBLIC_URL + '/UploadSimple.png'} alt="" />
          Upload
        </button>
      </div>

      <div className="video-grid">
        {videos.length === 0 ? (
          <div className="muted">ยังไม่มีวิดีโอ</div>
        ) : (
          videos.map(v => {
            let url = v.s3_url || '';
            if (url && !/^https?:\/\//i.test(url)) {
              url = `http://localhost:8000/static/${url.replace(/^.*[\\\/]/, '')}`;
            }
            const videoForEdit = { ...v, image: url };

            return (
              <VideoCard
                key={v.id}
                video={{
                  id: v.id,
                  title: v.title,
                  image: url,
                  duration: v.duration || '',
                  kcal: v.kcal || '',
                  statusBtn: v.approved ? 'Active' : (v.rejected ? 'Rejected' : 'Verifying'),
                }}
                cardHeight="stretch"
                cardMargin={4}
                onDelete={onDeleteVideo}
                onCardClick={() => onCardClick?.(v.id, videoForEdit)}
              />
            );
          })
        )}
      </div>

      {/* แสดงปุ่ม More เฉพาะตอนที่ยังไม่เต็มจอ */}
      {!isFull && (
        <div className="video-grid__more">
          <button className="btn-more" onClick={onExpand}>
            •••  More
          </button>
        </div>
      )}
    </main>
  );
}
