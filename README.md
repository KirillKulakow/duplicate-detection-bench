Duplicate Detection System
A powerful Node.js application with React frontend for detecting duplicate records using advanced algorithms including MinHash (Jaccard Similarity) and Levenshtein Distance.
🚀 Features

Dual Algorithm Support: MinHash for fast similarity detection and Levenshtein for precise edit distance
Server-Side Processing: Worker threads handle heavy computation without blocking the UI
Real-Time Progress: Live streaming updates during processing
Health Monitoring: Built-in system health checks and worker status monitoring
Modern UI: Clean, responsive React interface with progress visualization
CSV Processing: Easy upload and processing of CSV files
Detailed Results: Comprehensive similarity analysis with expandable result views

🏗️ Architecture
Server-Side Components

Main Server (server/index.js)

Express.js server with streaming API endpoints
Worker thread management and health monitoring
Real-time progress updates via HTTP streaming


Worker Threads

MinHash Worker (server/workers/minhash-worker.js): Implements Jaccard similarity using MinHash signatures
Levenshtein Worker (server/workers/levenshtein-worker.js): Calculates edit distance between records


API Endpoints

POST /api/process-duplicates: Main processing endpoint with streaming response
GET /api/health: System and worker health monitoring



Client-Side Components

Main App (client/src/App.js): Primary React component handling file upload and processing coordination
WorkerStatus (client/src/components/WorkerStatus.js): Real-time system health monitoring
ProgressBar (client/src/components/ProgressBar.js): Live progress visualization
ResultsDisplay (client/src/components/ResultsDisplay.js): Comprehensive results presentation

📦 Installation
Prerequisites

Node.js (v14 or higher)
npm or yarn

Setup Instructions

Clone the repository
bashgit clone <repository-url>
cd duplicate-detection-system

Install server dependencies
bashnpm install

Install client dependencies
bashcd client
npm install
cd ..

Quick install (both server and client)
bashnpm run install-all


🚀 Running the Application
Development Mode
bash# Run both server and client concurrently
npm run dev

# Or run separately:
npm run server    # Starts server on port 5000
npm run client    # Starts client on port 3000
Production Mode
bash# Build client for production
npm run build

# Start production server
npm start
📊 How It Works
1. Data Upload

Users upload CSV files through the React interface
Files are parsed client-side using PapaParse
Data validation ensures proper CSV format

2. Server Processing

Data is sent to the server via /api/process-duplicates endpoint
Server spawns appropriate worker threads based on selected algorithm
Workers process data in isolated threads to prevent blocking

3. Algorithm Processing
MinHash (Jaccard Similarity)

Converts text to n-gram shingles (default: 3-character)
Generates MinHash signatures using multiple hash functions
Calculates Jaccard similarity between signatures
Fast processing suitable for large datasets

Levenshtein Distance

Calculates edit distance between normalized text strings
Uses dynamic programming with memoization for efficiency
Provides precise character-level similarity measurement
More computationally intensive but highly accurate

4. Real-Time Updates

Progress updates stream from workers to client
Live percentage and status updates during processing
No WebSocket required - uses HTTP streaming

5. Results Display

Comprehensive statistics including execution time and duplicate counts
Expandable result sections for detailed analysis
Side-by-side record comparison for found duplicates
Similarity scores and distance metrics

🔧 Configuration
Algorithm Parameters
MinHash Settings

Hash Functions: 128 (configurable in worker)
Shingle Size: 3 characters (configurable)
Similarity Threshold: 70% (adjustable)

Levenshtein Settings

Similarity Threshold: 80% (adjustable)
Text Normalization: Lowercase, remove punctuation
Memoization: Built-in caching for performance

Server Configuration

Port: 5000 (configurable via PORT environment variable)
Request Limits: 50MB JSON payload limit
Health Check Interval: 30 seconds (client-side)

📈 Performance
Optimization Features

Worker Threads: Prevent main thread blocking
Streaming Responses: Real-time progress without waiting
Memoization: Cache Levenshtein calculations
Result Limiting: Display top 100 duplicates for UI performance
Memory Management: Efficient data handling in workers

Benchmarks

MinHash: Suitable for datasets with 10,000+ records
Levenshtein: Optimized for datasets up to 5,000 records
Memory Usage: Scales linearly with dataset size
Processing Speed: Varies by algorithm and data complexity

🔍 API Reference
POST /api/process-duplicates
Processes uploaded data for duplicate detection.
Request Body:
json{
  "data": [
    {"field1": "value1", "field2": "value2"},
    {"field1": "value3", "field2": "value4"}
  ],
  "algorithm": "both|minhash|levenshtein"
}
Response: Streaming text with progress updates and final results
GET /api/health
Returns system health status and worker availability.
Response:
json{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "workers": {
    "minhash": {"available": true, "lastCheck": 1234567890},
    "levenshtein": {"available": true, "lastCheck": 1234567890}
  },
  "uptime": 3600
}
🛠️ Development
Project Structure
duplicate-detection-system/
├── server/
│   ├── index.js              # Main server file
│   └── workers/
│       ├── minhash-worker.js    # MinHash implementation
│       └── levenshtein-worker.js # Levenshtein implementation
├── client/
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── App.css           # Styles
│   │   └── components/       # React components
│   └── public/               # Static assets
├── package.json              # Server dependencies
└── README.md                 # This file
Adding New Algorithms

Create new worker file in server/workers/
Implement worker with progress reporting
Update server routing in server/index.js
Add UI components for new algorithm

Environment Variables

PORT: Server port (default: 5000)
NODE_ENV: Environment mode (development/production)

🐛 Troubleshooting
Common Issues

Worker Thread Errors

Check Node.js version (requires v14+)
Verify worker file paths are correct
Monitor memory usage for large datasets


CSV Upload Issues

Ensure proper CSV format with headers
Check file size limits (50MB max)
Verify encoding is UTF-8


Performance Issues

Reduce dataset size for Levenshtein algorithm
Adjust similarity thresholds
Monitor system resources



Debug Mode
Enable detailed logging by setting environment variables:
bashDEBUG=worker:* npm run dev
🤝 Contributing

Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.
🙏 Acknowledgments

MinHash Algorithm: Based on Andrei Broder's work on web duplicate detection
Levenshtein Distance: Vladimir Levenshtein's edit distance algorithm
React Community: For excellent documentation and components
Node.js Team: For worker_threads implementation

📞 Support
For support, please open an issue on GitHub or contact the development team.

Built with ❤️ using Node.js, React, and advanced duplicate detection algorithms.