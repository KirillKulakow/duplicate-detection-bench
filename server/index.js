const express = require('express');
const cors = require('cors');
const path = require('path');
const { Worker } = require('worker_threads');
const multer = require('multer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Worker status tracking
const workerStatus = {
  minhash: { available: true, lastCheck: Date.now() },
  levenshtein: { available: true, lastCheck: Date.now() }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    workers: workerStatus,
    uptime: process.uptime()
  });
});

// Process duplicates endpoint with streaming
app.post('/api/process-duplicates', (req, res) => {
  const { data, algorithm = 'both' } = req.body;
  
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  // Set up streaming response
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendProgress = (progress) => {
    res.write(`data: ${JSON.stringify(progress)}\n\n`);
  };

  const processWithWorker = (workerPath, algorithm) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerPath, {
        workerData: { data, algorithm }
      });

      worker.on('message', (message) => {
        if (message.type === 'progress') {
          sendProgress({
            algorithm,
            progress: message.progress,
            status: message.status
          });
        } else if (message.type === 'result') {
          resolve(message.result);
        }
      });

      worker.on('error', (error) => {
        console.error(`Worker error (${algorithm}):`, error);
        workerStatus[algorithm].available = false;
        reject(error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  };

  const runProcessing = async () => {
    try {
      const results = {};
      
      if (algorithm === 'both' || algorithm === 'minhash') {
        sendProgress({ algorithm: 'minhash', progress: 0, status: 'Starting MinHash processing...' });
        results.minhash = await processWithWorker(
          path.join(__dirname, 'workers/minhash-worker.js'),
          'minhash'
        );
        workerStatus.minhash.available = true;
        workerStatus.minhash.lastCheck = Date.now();
      }

      if (algorithm === 'both' || algorithm === 'levenshtein') {
        sendProgress({ algorithm: 'levenshtein', progress: 0, status: 'Starting Levenshtein processing...' });
        results.levenshtein = await processWithWorker(
          path.join(__dirname, 'workers/levenshtein-worker.js'),
          'levenshtein'
        );
        workerStatus.levenshtein.available = true;
        workerStatus.levenshtein.lastCheck = Date.now();
      }

      // Send final results
      res.write(`data: ${JSON.stringify({
        type: 'complete',
        results,
        timestamp: new Date().toISOString()
      })}\n\n`);
      
      res.end();
    } catch (error) {
      console.error('Processing error:', error);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: error.message
      })}\n\n`);
      res.end();
    }
  };

  runProcessing();
});

// Serve React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}