import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { 
  Upload, FileText, Play, CheckCircle, AlertCircle, Activity, 
  Clock, Database, Target, Zap, TrendingUp, BarChart3,
  Users, Cpu, Memory, Timer, Award, Gauge
} from 'lucide-react';
import './App.css';

// Import components
import BenchmarkCard from './components/BenchmarkCard';
import ProgressBar from './components/ProgressBar';
import ResultsComparison from './components/ResultsComparison';
import DataPreview from './components/DataPreview';

function App() {
  const [csvData, setCsvData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({});
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('both');
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFileName(file.name);
    setError('');

    Papa.parse(file, {
      complete: (result) => {
        if (result.errors.length > 0) {
          setError('Error parsing CSV: ' + result.errors[0].message);
          return;
        }
        
        const filteredData = result.data.filter(row => 
          Object.values(row).some(cell => cell && cell.toString().trim() !== '')
        );
        
        setCsvData(filteredData);
      },
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
  };

  const processData = async (algorithm = selectedAlgorithm) => {
    if (!csvData) {
      setError('Please upload a CSV file first');
      return;
    }

    setProcessing(true);
    setProgress({});
    setResults(null);
    setError('');

    try {
      const response = await fetch('/api/process-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: csvData,
          algorithm
        })
      });

      if (!response.ok) {
        throw new Error('Server error');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'complete') {
                setResults(data.results);
                setProcessing(false);
              } else if (data.type === 'error') {
                setError(data.error);
                setProcessing(false);
              } else if (data.algorithm) {
                setProgress(prev => ({
                  ...prev,
                  [data.algorithm]: {
                    progress: data.progress,
                    status: data.status
                  }
                }));
              }
            } catch (e) {
              console.error('Error parsing progress data:', e);
            }
          }
        }
      }
    } catch (error) {
      setError('Error processing data: ' + error.message);
      setProcessing(false);
    }
  };

  const resetApp = () => {
    setCsvData(null);
    setFileName('');
    setProcessing(false);
    setProgress({});
    setResults(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const calculateEfficiency = (result) => {
    if (!result) return 0;
    const timeScore = Math.max(0, 100 - (result.executionTime / 100));
    const accuracyScore = (result.duplicatesFound / result.totalItems) * 100;
    return Math.round((timeScore + accuracyScore) / 2);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <Activity className="header-icon" />
            <div>
              <h1>Duplicate Detection Benchmark System</h1>
              <p>Advanced similarity analysis with real-time performance metrics</p>
            </div>
          </div>
          <div className="header-stats">
            {csvData && (
              <>
                <div className="stat-item">
                  <Database className="stat-icon" />
                  <span>{csvData.length} Records</span>
                </div>
                <div className="stat-item">
                  <FileText className="stat-icon" />
                  <span>{Object.keys(csvData[0] || {}).length} Fields</span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* File Upload Section */}
        <section className="upload-section">
          <div className="upload-card">
            <div className="upload-area">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="file-input"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="upload-label">
                <Upload className="upload-icon" />
                <div className="upload-text">
                  <span className="upload-title">Choose CSV File</span>
                  <span className="upload-subtitle">Upload your dataset for duplicate analysis</span>
                </div>
              </label>
              
              {fileName && (
                <div className="file-info">
                  <div className="file-details">
                    <FileText className="file-icon" />
                    <div className="file-text">
                      <span className="file-name">{fileName}</span>
                      <span className="file-count">{csvData ? csvData.length : 0} records loaded</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {csvData && !processing && (
              <div className="controls-section">
                <div className="algorithm-selector">
                  <h3>Select Algorithm</h3>
                  <div className="algorithm-options">
                    <button 
                      onClick={() => setSelectedAlgorithm('both')}
                      className={`algorithm-btn ${selectedAlgorithm === 'both' ? 'active' : ''}`}
                    >
                      <BarChart3 className="btn-icon" />
                      Both Algorithms
                    </button>
                    <button 
                      onClick={() => setSelectedAlgorithm('minhash')}
                      className={`algorithm-btn ${selectedAlgorithm === 'minhash' ? 'active' : ''}`}
                    >
                      <Zap className="btn-icon" />
                      MinHash (Fast)
                    </button>
                    <button 
                      onClick={() => setSelectedAlgorithm('levenshtein')}
                      className={`algorithm-btn ${selectedAlgorithm === 'levenshtein' ? 'active' : ''}`}
                    >
                      <Target className="btn-icon" />
                      Levenshtein (Precise)
                    </button>
                  </div>
                </div>

                <div className="action-controls">
                  <button 
                    onClick={() => processData()} 
                    className="btn btn-primary btn-large"
                  >
                    <Play className="btn-icon" />
                    Start Benchmark Analysis
                  </button>
                  <button 
                    onClick={resetApp} 
                    className="btn btn-outline"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Data Preview */}
        {csvData && !processing && !results && (
          <DataPreview data={csvData.slice(0, 5)} />
        )}

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <AlertCircle className="error-icon" />
            <div className="error-content">
              <span className="error-title">Processing Error</span>
              <span className="error-text">{error}</span>
            </div>
          </div>
        )}

        {/* Progress Section */}
        {processing && (
          <section className="progress-section">
            <div className="progress-header">
              <Cpu className="progress-header-icon" />
              <h3>Processing Analysis</h3>
            </div>
            
            <div className="progress-grid">
              {progress.minhash && (
                <ProgressBar
                  algorithm="MinHash"
                  progress={progress.minhash.progress}
                  status={progress.minhash.status}
                  icon={<Zap />}
                  color="#00d4aa"
                />
              )}
              {progress.levenshtein && (
                <ProgressBar
                  algorithm="Levenshtein"
                  progress={progress.levenshtein.progress}
                  status={progress.levenshtein.status}
                  icon={<Target />}
                  color="#ff6b6b"
                />
              )}
            </div>
          </section>
        )}

        {/* Benchmark Results */}
        {results && !processing && (
          <section className="results-section">
            <div className="results-header">
              <div className="results-title">
                <CheckCircle className="success-icon" />
                <div>
                  <h3>Benchmark Results</h3>
                  <p>Comprehensive performance analysis completed</p>
                </div>
              </div>
              <div className="results-summary">
                <div className="summary-stat">
                  <Timer className="summary-icon" />
                  <span>Total Time: {formatTime(
                    (results.minhash?.executionTime || 0) + (results.levenshtein?.executionTime || 0)
                  )}</span>
                </div>
                <div className="summary-stat">
                  <Users className="summary-icon" />
                  <span>Duplicates: {
                    (results.minhash?.duplicatesFound || 0) + (results.levenshtein?.duplicatesFound || 0)
                  }</span>
                </div>
              </div>
            </div>

            {/* Benchmark Cards */}
            <div className="benchmark-grid">
              {results.minhash && (
                <BenchmarkCard
                  title="MinHash Algorithm"
                  subtitle="Jaccard Similarity Analysis"
                  icon={<Zap />}
                  color="#00d4aa"
                  result={results.minhash}
                  efficiency={calculateEfficiency(results.minhash)}
                  metrics={[
                    { label: 'Execution Time', value: formatTime(results.minhash.executionTime), icon: <Clock /> },
                    { label: 'Total Items', value: results.minhash.totalItems.toLocaleString(), icon: <Database /> },
                    { label: 'Duplicates Found', value: results.minhash.duplicatesFound.toLocaleString(), icon: <Users /> },
                    { label: 'Accuracy Rate', value: `${((results.minhash.duplicatesFound / results.minhash.totalItems) * 100).toFixed(1)}%`, icon: <Target /> }
                  ]}
                />
              )}

              {results.levenshtein && (
                <BenchmarkCard
                  title="Levenshtein Algorithm"
                  subtitle="Edit Distance Analysis"
                  icon={<Target />}
                  color="#ff6b6b"
                  result={results.levenshtein}
                  efficiency={calculateEfficiency(results.levenshtein)}
                  metrics={[
                    { label: 'Execution Time', value: formatTime(results.levenshtein.executionTime), icon: <Clock /> },
                    { label: 'Total Items', value: results.levenshtein.totalItems.toLocaleString(), icon: <Database /> },
                    { label: 'Duplicates Found', value: results.levenshtein.duplicatesFound.toLocaleString(), icon: <Users /> },
                    { label: 'Cache Size', value: results.levenshtein.cacheSize?.toLocaleString() || 'N/A', icon: <Memory /> }
                  ]}
                />
              )}
            </div>

            {/* Results Comparison */}
            {results.minhash && results.levenshtein && (
              <ResultsComparison 
                minhash={results.minhash} 
                levenshtein={results.levenshtein} 
              />
            )}

            {/* Detailed Results */}
            <div className="detailed-results">
              {Object.entries(results).map(([algorithm, data]) => (
                <div key={algorithm} className="algorithm-details">
                  <div className="details-header">
                    <div className="details-title">
                      {algorithm === 'minhash' ? <Zap /> : <Target />}
                      <h4>{data.algorithm} - Detailed Results</h4>
                    </div>
                    <div className="details-stats">
                      <span className="stat-badge">
                        Threshold: {(data.threshold * 100).toFixed(0)}%
                      </span>
                      <span className="stat-badge">
                        Showing top {Math.min(data.duplicates?.length || 0, 10)} results
                      </span>
                    </div>
                  </div>

                  {data.duplicates && data.duplicates.length > 0 && (
                    <div className="duplicates-list">
                      {data.duplicates.slice(0, 10).map((duplicate, index) => (
                        <div key={index} className="duplicate-item">
                          <div className="duplicate-header">
                            <div className="similarity-badge">
                              {(duplicate.similarity * 100).toFixed(1)}% Match
                            </div>
                            {duplicate.distance !== undefined && (
                              <div className="distance-info">
                                Edit Distance: {duplicate.distance}
                              </div>
                            )}
                          </div>
                          <div className="duplicate-content">
                            <div className="record-section">
                              <h6>Record A (Index: {duplicate.indices[0]})</h6>
                              <div className="record-data">
                                {Object.entries(duplicate.item1).map(([key, value]) => (
                                  <div key={key} className="field-pair">
                                    <span className="field-label">{key}:</span>
                                    <span className="field-value">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="record-section">
                              <h6>Record B (Index: {duplicate.indices[1]})</h6>
                              <div className="record-data">
                                {Object.entries(duplicate.item2).map(([key, value]) => (
                                  <div key={key} className="field-pair">
                                    <span className="field-label">{key}:</span>
                                    <span className="field-value">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-info">
            <Activity className="footer-icon" />
            <span>Powered by advanced duplicate detection algorithms</span>
          </div>
          <div className="footer-stats">
            <span>Node.js • React • Vercel</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;