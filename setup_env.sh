#!/bin/bash

# ENY AI Frontend - Environment Setup Script
# This script creates the necessary environment files for production API

echo "🎨 Setting up ENY AI Frontend for Production API..."

# Create .env.local for development
cat > .env.local << 'ENVLOCAL'
# ENY AI Student Support Portal - Frontend Environment Variables
# Development Configuration with Production API

# API Configuration - Production Backend
REACT_APP_API_URL=https://enyapi.josephofili.live/api/v1
REACT_APP_STREAMING_URL=https://enyapi.josephofili.live/api/v1/streaming

# Application Configuration
REACT_APP_APP_NAME=ENY AI Student Portal
REACT_APP_VERSION=2.0.0

# Environment
NODE_ENV=development

# Feature Flags
REACT_APP_ENABLE_DARK_MODE=false
REACT_APP_ENABLE_ANALYTICS=false
ENVLOCAL

# Create .env.production for production builds
cat > .env.production << 'ENVPROD'
# ENY AI Student Support Portal - Frontend Environment Variables
# Production Configuration

# API Configuration - Production Backend
REACT_APP_API_URL=https://enyapi.josephofili.live/api/v1
REACT_APP_STREAMING_URL=https://enyapi.josephofili.live/api/v1/streaming

# Application Configuration
REACT_APP_APP_NAME=ENY AI Student Portal
REACT_APP_VERSION=2.0.0

# Environment
NODE_ENV=production

# Feature Flags
REACT_APP_ENABLE_DARK_MODE=false
REACT_APP_ENABLE_ANALYTICS=true

# Performance
GENERATE_SOURCEMAP=false
ENVPROD

echo "✅ Environment files created successfully!"
echo ""
echo "📁 Files created:"
echo "  - .env.local (for development)"
echo "  - .env.production (for production builds)"
echo ""
echo "🚀 Next steps:"
echo "  1. Run: npm start"
echo "  2. Your frontend will connect to: https://enyapi.josephofili.live"
echo "  3. Test the health endpoint: https://enyapi.josephofili.live/api/v1/streaming/health"
echo ""
echo "🎉 Setup complete!"
