import React from 'react';
import { BarChart3, Clock, Target, TrendingUp, Users } from 'lucide-react';

const ResultsComparison = ({ minhash, levenshtein }) => {
  const getWinner = (metric) => {
    switch (metric) {
      case 'speed':
        return minhash.executionTime < levenshtein.executionTime ? 'minhash' : 'levenshtein';
      case 'duplicates':
        return minhash.duplicatesFound > levenshtein.duplicatesFound ? 'minhash' : 'levenshtein';
      case 'accuracy':
        return levenshtein.duplicatesFound > minhash.duplicatesFound ? 'levenshtein' : 'minhash';
      default:
        return 'tie';
    }
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="results-comparison">
      <div className="comparison-header">
        <BarChart3 className="comparison-icon" />
        <h4>Algorithm Performance Comparison</h4>
      </div>

      <div className="comparison-grid">
        <div className="comparison-metric">
          <div className="metric-header">
            <Clock className="metric-icon" />
            <span className="metric-name">Execution Speed</span>
          </div>
          <div className="metric-bars">
            <div className="metric-bar">
              <div className="bar-info">
                <span>MinHash</span>
                <span>{formatTime(minhash.executionTime)}</span>
              </div>
              <div className="bar-container">
                <div 
                  className="bar-fill minhash" 
                  style={{ 
                    width: `${(minhash.executionTime / Math.max(minhash.executionTime, levenshtein.executionTime)) * 100}%` 
                  }}
                />
              </div>
            </div>
            <div className="metric-bar">
              <div className="bar-info">
                <span>Levenshtein</span>
                <span>{formatTime(levenshtein.executionTime)}</span>
              </div>
              <div className="bar-container">
                <div 
                  className="bar-fill levenshtein" 
                  style={{ 
                    width: `${(levenshtein.executionTime / Math.max(minhash.executionTime, levenshtein.executionTime)) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
          <div className="winner-badge">
            {getWinner('speed') === 'minhash' ? '🏆 MinHash Faster' : '🏆 Levenshtein Faster'}
          </div>
        </div>

        <div className="comparison-metric">
          <div className="metric-header">
            <Users className="metric-icon" />
            <span className="metric-name">Duplicates Found</span>
          </div>
          <div className="metric-bars">
            <div className="metric-bar">
              <div className="bar-info">
                <span>MinHash</span>
                <span>{minhash.duplicatesFound}</span>
              </div>
              <div className="bar-container">
                <div 
                  className="bar-fill minhash" 
                  style={{ 
                    width: `${(minhash.duplicatesFound / Math.max(minhash.duplicatesFound, levenshtein.duplicatesFound)) * 100}%` 
                  }}
                />
              </div>
            </div>
            <div className="metric-bar">
              <div className="bar-info">
                <span>Levenshtein</span>
                <span>{levenshtein.duplicatesFound}</span>
              </div>
              <div className="bar-container">
                <div 
                  className="bar-fill levenshtein" 
                  style={{ 
                    width: `${(levenshtein.duplicatesFound / Math.max(minhash.duplicatesFound, levenshtein.duplicatesFound)) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
          <div className="winner-badge">
            {getWinner('duplicates') === 'minhash' ? '🎯 MinHash Found More' : '🎯 Levenshtein Found More'}
          </div>
        </div>

        <div className="comparison-metric">
          <div className="metric-header">
            <Target className="metric-icon" />
            <span className="metric-name">Precision Rate</span>
          </div>
          <div className="metric-bars">
            <div className="metric-bar">
              <div className="bar-info">
                <span>MinHash</span>
                <span>{((minhash.duplicatesFound / minhash.totalItems) * 100).toFixed(1)}%</span>
              </div>
              <div className="bar-container">
                <div 
                  className="bar-fill minhash" 
                  style={{ 
                    width: `${(minhash.duplicatesFound / minhash.totalItems) * 100}%` 
                  }}
                />
              </div>
            </div>
            <div className="metric-bar">
              <div className="bar-info">
                <span>Levenshtein</span>
                <span>{((levenshtein.duplicatesFound / levenshtein.totalItems) * 100).toFixed(1)}%</span>
              </div>
              <div className="bar-container">
                <div 
                  className="bar-fill levenshtein" 
                  style={{ 
                    width: `${(levenshtein.duplicatesFound / levenshtein.totalItems) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
          <div className="winner-badge">
            {getWinner('accuracy') === 'minhash' ? '📊 MinHash Higher Precision' : '📊 Levenshtein Higher Precision'}
          </div>
        </div>
      </div>

      <div className="comparison-summary">
        <div className="summary-card">
          <TrendingUp className="summary-icon" />
          <div className="summary-content">
            <h5>Recommendation</h5>
            <p>
              {minhash.executionTime < levenshtein.executionTime 
                ? "MinHash is faster for large datasets with good approximate results."
                : "Levenshtein provides more precise matching for smaller datasets."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsComparison;