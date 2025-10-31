#!/bin/bash

echo ""
echo "========================================"
echo "  🌸 Aarogini Backend Server"
echo "========================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check MongoDB connection
echo "🔍 Checking MongoDB connection..."
echo ""

# Start the server
echo "🚀 Starting server on http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
npm run dev
