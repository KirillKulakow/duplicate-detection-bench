import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, Play, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import './App.css';

function App() {
  const [csvData, setCsvData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
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

  const processData = async () => {
    if (!csvData) {
      setError('Please upload a CSV file first');
      return;
    }

    setProcessing(true);
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
          algorithm: 'both'
        })
      });

      if (!response.ok) {
        throw new Error('Server error');
      }

      // Handle streaming response
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <Activity size={32} />
          Duplicate Detection System
        </h1>
        <p>Advanced duplicate detection using MinHash and Levenshtein algorithms</p>
      </header>

      <main className="main-content">
        <div className="upload-section">
          <div className="upload-card">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="file-input"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="upload-label">
              <Upload size={24} />
              Choose CSV File
            </label>
            
            {fileName && (
              <div className="file-info">
                <FileText size={20} />
                <span>{fileName}</span>
                <span className="file-count">
                  ({csvData ? csvData.length : 0} records)
                </span>
              </div>
            )}

            {csvData && !processing && (
              <button onClick={processData} className="btn btn-primary">
                <Play size={16} />
                Process Data
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {processing && (
          <div className="progress-section">
            <p>Processing data...</p>
          </div>
        )}

        {results && (
          <div className="results-section">
            <CheckCircle size={24} />
            <h3>Processing Complete</h3>
            <pre>{JSON.stringify(results, null, 2)}</pre>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;