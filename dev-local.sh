#!/bin/bash

echo "🔧 Starting local development with Vercel"
echo "========================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Install client dependencies if needed
if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
fi

# Start Vercel dev server
echo "🚀 Starting development server..."
echo "Frontend: http://localhost:3000"
echo "API: http://localhost:3000/api/*"
vercel dev