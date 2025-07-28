import React from 'react';
import { TrendingUp, Award, Gauge } from 'lucide-react';

const BenchmarkCard = ({ title, subtitle, icon, color, result, efficiency, metrics }) => {
  const getEfficiencyColor = (score) => {
    if (score >= 80) return '#00d4aa';
    if (score >= 60) return '#ffa726';
    return '#ff6b6b';
  };

  const getEfficiencyLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Optimization';
  };

  return (
    <div className="benchmark-card" style={{ borderColor: color }}>
      <div className="card-header">
        <div className="card-title">
          <div className="card-icon" style={{ color }}>
            {icon}
          </div>
          <div className="card-text">
            <h4>{title}</h4>
            <p>{subtitle}</p>
          </div>
        </div>
        <div className="efficiency-badge">
          <Gauge className="efficiency-icon" style={{ color: getEfficiencyColor(efficiency) }} />
          <div className="efficiency-info">
            <span className="efficiency-score" style={{ color: getEfficiencyColor(efficiency) }}>
              {efficiency}%
            </span>
            <span className="efficiency-label">{getEfficiencyLabel(efficiency)}</span>
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-item">
            <div className="metric-icon" style={{ color }}>
              {metric.icon}
            </div>
            <div className="metric-content">
              <span className="metric-label">{metric.label}</span>
              <span className="metric-value">{metric.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card-footer">
        <div className="performance-indicator">
          <TrendingUp className="trend-icon" />
          <span>Performance Score: {efficiency}/100</span>
        </div>
        {efficiency >= 80 && (
          <div className="award-badge">
            <Award className="award-icon" />
            <span>High Performance</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BenchmarkCard;