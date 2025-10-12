/**
 * 🎯 Enhanced Multi-Directional Display Component
 * แสดงการวิเคราะห์ท่าทางแบบ 8 ทิศทางแบบ real-time
 */

import React from 'react';
import { multiDirectionalPoseComparator } from '../utils/MultiDirectionalPoseComparator';
import './MultiDirectionalDisplay.css';

const MultiDirectionalDisplay = ({ 
  matchScore, 
  feedback, 
  bodyPartScores, 
  jointComparisons,
  trainerDirection,
  traineeDirection,
  confidenceLevel,
  recommendations,
  isActive = true 
}) => {
  
  // สร้าง gradient สำหรับ accuracy bar
  const getAccuracyGradient = (score) => {
    if (score >= 85) return 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)';
    if (score >= 70) return 'linear-gradient(180deg, #eab308 0%, #ca8a04 100%)';
    if (score >= 50) return 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)';
    return 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)';
  };

  const getScoreEmoji = (score) => {
    if (score >= 90) return '🎉';
    if (score >= 80) return '👍';
    if (score >= 70) return '⚡';
    if (score >= 60) return '⚠️';
    if (score >= 40) return '🔄';
    return '🎯';
  };

  const getDirectionIcon = (direction) => {
    const icons = {
      'FRONT': '⬆️',
      'FRONT_RIGHT': '↗️',
      'RIGHT': '➡️',
      'BACK_RIGHT': '↘️',
      'BACK': '⬇️',
      'BACK_LEFT': '↙️',
      'LEFT': '⬅️',
      'FRONT_LEFT': '↖️',
      'UNKNOWN': '❓'
    };
    return icons[direction] || '❓';
  };

  const getDirectionColor = (direction) => {
    const colors = {
      'FRONT': '#22c55e',
      'FRONT_RIGHT': '#84cc16',
      'RIGHT': '#eab308',
      'BACK_RIGHT': '#f97316',
      'BACK': '#ef4444',
      'BACK_LEFT': '#ec4899',
      'LEFT': '#8b5cf6',
      'FRONT_LEFT': '#3b82f6',
      'UNKNOWN': '#6b7280'
    };
    return colors[direction] || '#6b7280';
  };

  return (
    <div className={`multi-directional-display ${isActive ? 'active' : 'inactive'}`}>
      
      {/* Main Accuracy Section */}
      <div className="main-accuracy-section">
        <div className="accuracy-header">
          <span className="accuracy-emoji">{getScoreEmoji(matchScore)}</span>
          <div className="accuracy-title">Real-Time Score</div>
        </div>
        
        <div className="accuracy-bar-container">
          <div className="accuracy-bar">
            <div 
              className="accuracy-fill" 
              style={{ 
                height: `${matchScore}%`,
                background: getAccuracyGradient(matchScore)
              }}
            >
              <div className="accuracy-shimmer"></div>
            </div>
          </div>
          
          <div className="accuracy-percentage">
            {matchScore}%
          </div>
        </div>
        
        {confidenceLevel > 0 && (
          <div className="confidence-indicator">
            <div className="confidence-bar">
              <div 
                className="confidence-fill"
                style={{ width: `${confidenceLevel}%` }}
              ></div>
            </div>
            <span className="confidence-text">Confidence: {confidenceLevel}%</span>
          </div>
        )}
      </div>

      {/* Direction Comparison */}
      <div className="direction-comparison">
        <div className="direction-title">🧭 Body Direction</div>
        <div className="direction-grid">
          <div className="direction-item trainer">
            <div className="direction-label">Trainer</div>
            <div 
              className="direction-icon"
              style={{ color: getDirectionColor(trainerDirection) }}
            >
              {getDirectionIcon(trainerDirection)}
            </div>
            <div className="direction-name">
              {multiDirectionalPoseComparator.getDirectionThai?.(trainerDirection) || trainerDirection}
            </div>
          </div>
          
          <div className="direction-separator">
            {trainerDirection === traineeDirection ? '✅' : '🔄'}
          </div>
          
          <div className="direction-item trainee">
            <div className="direction-label">You</div>
            <div 
              className="direction-icon"
              style={{ color: getDirectionColor(traineeDirection) }}
            >
              {getDirectionIcon(traineeDirection)}
            </div>
            <div className="direction-name">
              {multiDirectionalPoseComparator.getDirectionThai?.(traineeDirection) || traineeDirection}
            </div>
          </div>
        </div>
      </div>

      {/* Joint Angles Analysis */}
      {Object.keys(jointComparisons).length > 0 && (
        <div className="joint-analysis">
          <div className="joint-title">📐 Joint Angles</div>
          <div className="joint-grid">
            {Object.entries(jointComparisons)
              .filter(([, comparison]) => comparison.accuracy > 0)
              .sort(([,a], [,b]) => b.accuracy - a.accuracy)
              .slice(0, 6)
              .map(([jointName, comparison]) => (
                <div key={jointName} className="joint-item">
                  <div className="joint-header">
                    <span className="joint-name">
                      {multiDirectionalPoseComparator.getJointNameThai?.(jointName) || jointName}
                    </span>
                    <span 
                      className="joint-accuracy"
                      style={{ color: multiDirectionalPoseComparator.getAccuracyColor(comparison.accuracy) }}
                    >
                      {Math.round(comparison.accuracy)}%
                    </span>
                  </div>
                  
                  <div className="joint-angles">
                    <div className="angle-comparison">
                      <span className="angle-label">T:</span>
                      <span className="angle-value">{comparison.trainerAngle}°</span>
                      <span className="angle-label">Y:</span>
                      <span className="angle-value">{comparison.traineeAngle}°</span>
                    </div>
                    {comparison.angleDifference !== null && (
                      <div className="angle-diff">
                        Δ {comparison.angleDifference}°
                      </div>
                    )}
                  </div>
                  
                  <div className="joint-bar">
                    <div 
                      className="joint-fill"
                      style={{ 
                        width: `${comparison.accuracy}%`,
                        backgroundColor: multiDirectionalPoseComparator.getAccuracyColor(comparison.accuracy)
                      }}
                    ></div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Body Parts Scores */}
      {Object.keys(bodyPartScores).length > 0 && (
        <div className="body-parts-section">
          <div className="body-parts-title">🎯 Body Parts</div>
          <div className="body-parts-grid">
            {Object.entries(bodyPartScores)
              .sort(([,a], [,b]) => b - a)
              .map(([part, score]) => (
                <div key={part} className="body-part-item">
                  <div className="body-part-header">
                    <span className="body-part-name">{part}</span>
                    <span 
                      className="body-part-score"
                      style={{ color: multiDirectionalPoseComparator.getAccuracyColor(score) }}
                    >
                      {Math.round(score)}%
                    </span>
                  </div>
                  <div className="body-part-bar">
                    <div 
                      className="body-part-fill"
                      style={{ 
                        width: `${score}%`,
                        backgroundColor: multiDirectionalPoseComparator.getAccuracyColor(score)
                      }}
                    ></div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Real-time Feedback */}
      <div className="feedback-section">
        <div className="feedback-bubble">
          <div className="feedback-content">
            {feedback}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="recommendations">
            <div className="recommendations-title">
              <span className="recommendations-icon">💡</span>
              <span>Quick Tips</span>
            </div>
            
            <div className="recommendations-list">
              {recommendations.slice(0, 2).map((rec, index) => (
                <div key={index} className="recommendation-item">
                  <span className="recommendation-dot">•</span>
                  <span className="recommendation-text">{rec.suggestion}</span>
                  <span 
                    className="recommendation-accuracy"
                    style={{ color: multiDirectionalPoseComparator.getAccuracyColor(rec.accuracy) }}
                  >
                    {Math.round(rec.accuracy)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className={`status-indicator ${isActive ? 'analyzing' : 'idle'}`}>
        <div className="status-dot"></div>
        <span className="status-text">
          {isActive ? 'Multi-Directional Analysis Active' : 'Waiting for pose detection'}
        </span>
      </div>
    </div>
  );
};

export default MultiDirectionalDisplay;