#!/bin/bash

echo "🚀 Deploying to Vercel"
echo "============================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Install client dependencies and build
echo "🔨 Building React client..."
cd client
npm install
npm run build
cd ..

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo "🌍 Your app should be live at the URL shown above"
echo ""
echo "📊 API endpoints available:"
echo "  - GET  /api/health"
echo "  - POST /api/process-duplicates"