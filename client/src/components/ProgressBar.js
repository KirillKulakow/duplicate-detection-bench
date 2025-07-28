import React from 'react';

const ProgressBar = ({ algorithm, progress, status, icon, color }) => {
  return (
    <div className="progress-container">
      <div className="progress-header">
        <div className="algorithm-info">
          <div className="progress-icon" style={{ color }}>
            {icon}
          </div>
          <div className="algorithm-details">
            <span className="algorithm-name">{algorithm}</span>
            <span className="algorithm-status">{status}</span>
          </div>
        </div>
        <div className="progress-percentage" style={{ color }}>
          {progress}%
        </div>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ 
            width: `${progress}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;