// Vercel Serverless Function for Health Check
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const workerStatus = {
    minhash: { available: true, lastCheck: Date.now() },
    levenshtein: { available: true, lastCheck: Date.now() }
  };

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    workers: workerStatus,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    platform: 'vercel'
  });
}