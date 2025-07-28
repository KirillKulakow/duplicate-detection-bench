// CommonJS format for Vercel serverless function
const { Worker } = require('worker_threads');
const path = require('path');

module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data, algorithm = 'both' } = req.body;
  
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  // Limit data size for Vercel serverless
  if (data.length > 1000) {
    return res.status(400).json({ 
      error: 'Dataset too large for serverless environment. Please limit to 1000 records or less.' 
    });
  }

  // Set up streaming response
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const sendProgress = (progress) => {
    res.write(`data: ${JSON.stringify(progress)}\n\n`);
  };

  const processWithWorker = (workerPath, algorithm) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker timeout'));
      }, 23000); // 23s timeout for Vercel

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
          clearTimeout(timeout);
          resolve(message.result);
        }
      });

      worker.on('error', (error) => {
        clearTimeout(timeout);
        console.error(`Worker error (${algorithm}):`, error);
        reject(error);
      });

      worker.on('exit', (code) => {
        clearTimeout(timeout);
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
      }

      if (algorithm === 'both' || algorithm === 'levenshtein') {
        sendProgress({ algorithm: 'levenshtein', progress: 0, status: 'Starting Levenshtein processing...' });
        results.levenshtein = await processWithWorker(
          path.join(__dirname, 'workers/levenshtein-worker.js'),
          'levenshtein'
        );
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
};