import React from 'react';
import { Loader } from 'lucide-react';

const ProgressBar = ({ algorithm, progress, status }) => {
  return (
    <div className="progress-container">
      <div className="progress-header">
        <div className="algorithm-info">
          <Loader className="progress-icon spinning" />
          <span className="algorithm-name">{algorithm}</span>
        </div>
        <span className="progress-percentage">{progress}%</span>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="progress-status">
        {status}
      </div>
    </div>
  );
};

export default ProgressBar;