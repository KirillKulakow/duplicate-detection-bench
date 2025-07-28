import React, { useState } from 'react';
import { BarChart3, Clock, Database, Users, ChevronDown, ChevronUp } from 'lucide-react';

const ResultsDisplay = ({ results }) => {
  const [expandedAlgorithm, setExpandedAlgorithm] = useState(null);
  const [expandedDuplicate, setExpandedDuplicate] = useState({});

  const toggleAlgorithm = (algorithm) => {
    setExpandedAlgorithm(expandedAlgorithm === algorithm ? null : algorithm);
  };

  const toggleDuplicate = (algorithm, index) => {
    const key = `${algorithm}-${index}`;
    setExpandedDuplicate(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatExecutionTime = (time) => {
    if (time < 1000) return `${Math.round(time)}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  const renderAlgorithmResults = (algorithmName, data) => {
    const isExpanded = expandedAlgorithm === algorithmName;
    
    return (
      <div key={algorithmName} className="algorithm-results">
        <div 
          className="algorithm-header"
          onClick={() => toggleAlgorithm(algorithmName)}
        >
          <div className="algorithm-title">
            <BarChart3 className="algorithm-icon" />
            <h4>{data.algorithm}</h4>
          </div>
          <div className="algorithm-summary">
            <span className="duplicate-count">
              {data.duplicatesFound} duplicates found
            </span>
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </div>
        </div>

        {isExpanded && (
          <div className="algorithm-details">
            <div className="stats-grid">
              <div className="stat-card">
                <Database className="stat-icon" />
                <div className="stat-info">
                  <div className="stat-label">Total Items</div>
                  <div className="stat-value">{data.totalItems.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="stat-card">
                <Users className="stat-icon" />
                <div className="stat-info">
                  <div className="stat-label">Duplicates Found</div>
                  <div className="stat-value">{data.duplicatesFound.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="stat-card">
                <Clock className="stat-icon" />
                <div className="stat-info">
                  <div className="stat-label">Execution Time</div>
                  <div className="stat-value">{formatExecutionTime(data.executionTime)}</div>
                </div>
              </div>

              <div className="stat-card">
                <BarChart3 className="stat-icon" />
                <div className="stat-info">
                  <div className="stat-label">Threshold</div>
                  <div className="stat-value">{(data.threshold * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>

            {data.duplicates && data.duplicates.length > 0 && (
              <div className="duplicates-section">
                <h5>Duplicate Records (Top {Math.min(data.duplicates.length, 10)})</h5>
                <div className="duplicates-list">
                  {data.duplicates.slice(0, 10).map((duplicate, index) => {
                    const key = `${algorithmName}-${index}`;
                    const isExpanded = expandedDuplicate[key];
                    
                    return (
                      <div key={index} className="duplicate-item">
                        <div 
                          className="duplicate-header"
                          onClick={() => toggleDuplicate(algorithmName, index)}
                        >
                          <div className="duplicate-info">
                            <span className="similarity-score">
                              {(duplicate.similarity * 100).toFixed(1)}% similar
                            </span>
                            {duplicate.distance !== undefined && (
                              <span className="distance-info">
                                (Distance: {duplicate.distance})
                              </span>
                            )}
                          </div>
                          {isExpanded ? <ChevronUp /> : <ChevronDown />}
                        </div>

                        {isExpanded && (
                          <div className="duplicate-details">
                            <div className="record-comparison">
                              <div className="record-section">
                                <h6>Record 1 (Index: {duplicate.indices[0]})</h6>
                                <div className="record-data">
                                  {Object.entries(duplicate.item1).map(([key, value]) => (
                                    <div key={key} className="field-row">
                                      <span className="field-name">{key}:</span>
                                      <span className="field-value">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="record-section">
                                <h6>Record 2 (Index: {duplicate.indices[1]})</h6>
                                <div className="record-data">
                                  {Object.entries(duplicate.item2).map(([key, value]) => (
                                    <div key={key} className="field-row">
                                      <span className="field-name">{key}:</span>
                                      <span className="field-value">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {data.duplicates.length > 10 && (
                  <div className="more-results">
                    ... and {data.duplicates.length - 10} more duplicates
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="results-display">
      {results.minhash && renderAlgorithmResults('minhash', results.minhash)}
      {results.levenshtein && renderAlgorithmResults('levenshtein', results.levenshtein)}
    </div>
  );
};

export default ResultsDisplay;