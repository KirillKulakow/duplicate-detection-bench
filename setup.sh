#!/bin/bash

# Duplicate Detection System Setup Script
# This script sets up the complete project structure and installs dependencies

echo "🚀 Setting up Duplicate Detection System..."
echo "========================================"

# Create project directory structure
echo "📁 Creating project structure..."

# Create server directories
mkdir -p server/workers

# Create client directories  
mkdir -p client/src/components
mkdir -p client/public

# Create server files
echo "📝 Creating server files..."

# Create main server package.json (already provided in artifacts)

# Create client package.json (already provided in artifacts)

# Create basic client public files
cat > client/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Advanced duplicate detection system using MinHash and Levenshtein algorithms"
    />
    <title>Duplicate Detection System</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

# Create client index.js
cat > client/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Create environment files
echo "🔧 Creating environment configuration..."

cat > .env.example << 'EOF'
# Server Configuration
PORT=5000
NODE_ENV=development

# Worker Configuration
MAX_WORKERS=4
WORKER_TIMEOUT=300000

# Performance Settings
MAX_UPLOAD_SIZE=50mb
HEALTH_CHECK_INTERVAL=30000
EOF

# Copy to actual .env file
cp .env.example .env

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
client/node_modules/

# Production builds
client/build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build directory
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# MacOS
.DS_Store

# Windows
Thumbs.db
ehthumbs.db
Desktop.ini

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Temporary files
*.tmp
*.temp
EOF

# Create development scripts
echo "🛠️ Creating development scripts..."

cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Duplicate Detection System in development mode..."
echo "Server will run on http://localhost:5000"
echo "Client will run on http://localhost:3000"
echo "Press Ctrl+C to stop both servers"
npm run dev
EOF

chmod +x start-dev.sh

cat > install-deps.sh << 'EOF'
#!/bin/bash
echo "📦 Installing server dependencies..."
npm install

echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

echo "✅ All dependencies installed successfully!"
echo "Run './start-dev.sh' to start the development servers"
EOF

chmod +x install-deps.sh

# Create production deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash
echo "🏗️ Building for production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd client && npm install && cd ..

# Build client
echo "🔨 Building React client..."
cd client && npm run build && cd ..

# Set production environment
export NODE_ENV=production

echo "✅ Build complete!"
echo "Run 'npm start' to start the production server"
EOF

chmod +x deploy.sh

# Create Docker configuration
echo "🐳 Creating Docker configuration..."

cat > Dockerfile << 'EOF'
# Multi-stage build for Node.js + React app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Build React app
RUN cd client && npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/build ./client/build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start application
CMD ["node", "server/index.js"]
EOF

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  duplicate-detection:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - duplicate-detection
    restart: unless-stopped
EOF

# Create nginx configuration
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream app {
        server duplicate-detection:5000;
    }

    server {
        listen 80;
        server_name localhost;

        # Enable gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        # Proxy API requests
        location /api/ {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Handle streaming responses
            proxy_buffering off;
            proxy_read_timeout 300s;
        }

        # Serve static files
        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
EOF

# Create test data
echo "📊 Creating sample test data..."
mkdir -p test-data

cat > test-data/sample-offers.csv << 'EOF'
id,title,description,price,category
1,"iPhone 13 Pro","Latest Apple iPhone with 128GB storage",999,"Electronics"
2,"iphone 13 pro","Apple iPhone with 128GB memory",1000,"Electronics"
3,"Samsung Galaxy S22","Android smartphone with great camera",899,"Electronics"
4,"Nike Air Max","Comfortable running shoes for athletes",120,"Footwear"
5,"Nike AirMax","Running shoes with air cushioning",125,"Footwear"
6,"MacBook Pro","Apple laptop for professionals",1999,"Electronics"
7,"Macbook Pro","Professional laptop from Apple",2000,"Electronics"
8,"Adidas Ultraboost","Premium running sneakers",180,"Footwear"
9,"Coffee Maker","Automatic drip coffee machine",89,"Appliances"
10,"Coffee Machine","Programmable coffee brewing system",95,"Appliances"
EOF

# Create testing script
cat > test-system.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing Duplicate Detection System..."

# Check if server is running
echo "Checking server health..."
curl -f http://localhost:5000/api/health || {
    echo "❌ Server is not running. Please start with './start-dev.sh' first."
    exit 1
}

echo "✅ Server is healthy!"

# You can add more automated tests here
echo "📊 Sample test data is available in test-data/sample-offers.csv"
echo "🌐 Open http://localhost:3000 in your browser to test the UI"
EOF

chmod +x test-system.sh

# Final setup completion
echo ""
echo "✅ Setup complete!"
echo "==================="
echo ""
echo "📁 Project structure created"
echo "📦 Configuration files ready"
echo "🐳 Docker configuration available"
echo "📊 Sample test data prepared"
echo ""
echo "Next steps:"
echo "1. Run './install-deps.sh' to install dependencies"
echo "2. Run './start-dev.sh' to start development servers"
echo "3. Open http://localhost:3000 in your browser"
echo "4. Upload test-data/sample-offers.csv to test the system"
echo ""
echo "For production deployment:"
echo "- Run './deploy.sh' for production build"
echo "- Use 'docker-compose up' for containerized deployment"
echo ""
echo "Happy duplicate detecting! 🔍"