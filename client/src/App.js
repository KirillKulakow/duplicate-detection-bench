import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, Play, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import './App.css';

import WorkerStatus from './components/WorkerStatus';
import ProgressBar from './components/ProgressBar';
import ResultsDisplay from './components/ResultsDisplay';

function App() {
  const [csvData, setCsvData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({});
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
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
        
        setCsvData(result.data.filter(row => 
          Object.values(row).some(cell => cell && cell.toString().trim() !== '')
        ));
      },
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
  };

  const processData = async (algorithm = 'both') => {
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

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>
            <Activity className="header-icon" />
            Duplicate Detection System
          </h1>
          <p>Advanced duplicate detection using MinHash and Levenshtein algorithms</p>
        </div>
      </header>

      <main className="main-content">
        <WorkerStatus />

        <div className="upload-section">
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
                <span>Choose CSV File</span>
              </label>
              
              {fileName && (
                <div className="file-info">
                  <FileText className="file-icon" />
                  <span>{fileName}</span>
                  <span className="file-count">
                    ({csvData ? csvData.length : 0} records)
                  </span>
                </div>
              )}
            </div>

            {csvData && !processing && (
              <div className="controls">
                <button 
                  onClick={() => processData('both')} 
                  className="btn btn-primary"
                >
                  <Play className="btn-icon" />
                  Run Both Algorithms
                </button>
                <button 
                  onClick={() => processData('minhash')} 
                  className="btn btn-secondary"
                >
                  MinHash Only
                </button>
                <button 
                  onClick={() => processData('levenshtein')} 
                  className="btn btn-secondary"
                >
                  Levenshtein Only
                </button>
                <button 
                  onClick={resetApp} 
                  className="btn btn-outline"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle className="error-icon" />
            <span>{error}</span>
          </div>
        )}

        {processing && (
          <div className="progress-section">
            <h3>Processing Progress</h3>
            {progress.minhash && (
              <ProgressBar
                algorithm="MinHash"
                progress={progress.minhash.progress}
                status={progress.minhash.status}
              />
            )}
            {progress.levenshtein && (
              <ProgressBar
                algorithm="Levenshtein"
                progress={progress.levenshtein.progress}
                status={progress.levenshtein.status}
              />
            )}
          </div>
        )}

        {results && !processing && (
          <div className="results-section">
            <div className="results-header">
              <CheckCircle className="success-icon" />
              <h3>Processing Complete</h3>
            </div>
            <ResultsDisplay results={results} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by Node.js worker threads and React</p>
      </footer>
    </div>
  );
}

export default App;