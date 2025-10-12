import React from "react";

export default function ReviewCard({ video, onApprove, onReject, onPlay }) {
    const trainerLabel = video.trainer_name ? video.trainer_name : `#${video.trainer_id}`;
    return (
        <article className="ar-card">
            <div className="ar-thumb-wrap" onClick={onPlay}>
                {video._src ? (
                    <video
                        className="ar-thumb"
                        src={video._src}
                        muted
                        preload="metadata"
                        onMouseOver={(e) => e.currentTarget.play()}
                        onMouseOut={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    />
                ) : (
                    <div className="ar-thumb ar-thumb--empty">no preview</div>
                )}
                <span className="ar-badge">Verifying</span>
            </div>

            <div className="ar-card-body">
                <h3 className="ar-title" title={video.title}>{video.title || "—"}</h3>


                <div className="rc-meta">
                   Trainer: <b>{trainerLabel}</b>
                </div>

                <div className="ar-meta">
                    
                    <div>Level: <b>{video._difficulty}</b></div>
                    <div >Created: <b>{video._createdLabel}</b></div>
                </div>

                {video.description && (
                    <p className="ar-desc" title={video.description}>{video.description}</p>
                )}

                <div className="ar-actions">
                    <button className="btn btn-approve" onClick={onApprove}>Approve</button>
                    <button className="btn btn-reject" onClick={onReject}>Reject</button>
                    <button className="btn btn-play" onClick={onPlay}>Play</button>
                </div>
            </div>
        </article>
    );
}
