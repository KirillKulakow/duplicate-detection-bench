import React, { useState, useEffect } from 'react';
import { Server, Cpu, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const WorkerStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/health');
      const data = await response.json();
      setStatus(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
      setStatus({ status: 'error', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusIcon = (available) => {
    return available ? (
      <CheckCircle className="status-icon status-online" />
    ) : (
      <XCircle className="status-icon status-offline" />
    );
  };

  if (loading && !status) {
    return (
      <div className="worker-status loading">
        <RefreshCw className="loading-icon" />
        <span>Checking system status...</span>
      </div>
    );
  }

  return (
    <div className="worker-status">
      <div className="status-header">
        <Server className="server-icon" />
        <h3>System Status</h3>
        <button 
          onClick={checkHealth} 
          className="refresh-btn"
          disabled={loading}
        >
          <RefreshCw className={`refresh-icon ${loading ? 'spinning' : ''}`} />
        </button>
      </div>

      {status && (
        <div className="status-grid">
          <div className="status-card server-status">
            <div className="status-info">
              <div className="status-label">Server</div>
              <div className="status-value">
                {getStatusIcon(status.status === 'healthy')}
                <span>{status.status === 'healthy' ? 'Online' : 'Offline'}</span>
              </div>
              {status.uptime && (
                <div className="uptime">
                  Uptime: {formatUptime(status.uptime)}
                </div>
              )}
            </div>
          </div>

          {status.workers && (
            <>
              <div className="status-card worker-status-card">
                <div className="status-info">
                  <Cpu className="worker-icon" />
                  <div className="status-label">MinHash Worker</div>
                  <div className="status-value">
                    {getStatusIcon(status.workers.minhash?.available)}
                    <span>
                      {status.workers.minhash?.available ? 'Ready' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="status-card worker-status-card">
                <div className="status-info">
                  <Cpu className="worker-icon" />
                  <div className="status-label">Levenshtein Worker</div>
                  <div className="status-value">
                    {getStatusIcon(status.workers.levenshtein?.available)}
                    <span>
                      {status.workers.levenshtein?.available ? 'Ready' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {lastUpdate && (
        <div className="last-update">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default WorkerStatus;