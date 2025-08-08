#!/bin/bash

echo "🔓 MSG Email Automation - No Password Tunnel"
echo "============================================"

echo "🚀 Using Serveo.net - No password required!"
echo "💡 This is the most reliable no-password solution"
echo ""

# Check if Node.js exists
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Build the application
echo "🔨 Building MSG Email Automation..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed"

# Start the application
echo "🚀 Starting MSG Email Automation server..."
npm start &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 8

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Server failed to start on port 3000"
    echo "💡 Trying alternative port 8080..."
    kill $SERVER_PID 2>/dev/null
    
    # Try port 8080
    PORT=8080 npm start &
    SERVER_PID=$!
    sleep 5
    
    if ! curl -s http://localhost:8080 > /dev/null; then
        echo "❌ Server failed to start on port 8080"
        exit 1
    fi
    
    PORT=8080
else
    PORT=3000
fi

echo "✅ Server is running on port $PORT"

# Create SSH tunnel using Serveo
echo "🌐 Creating Serveo tunnel (no password required)..."
echo "⏳ Establishing SSH connection..."

# Create the tunnel
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -R 80:localhost:$PORT serveo.net 2>&1 | while read line; do
    echo "$line"
    
    # Look for the URL in the output
    if [[ "$line" == *"https://"* ]] && [[ "$line" == *"serveo.net"* ]]; then
        URL=$(echo "$line" | grep -o 'https://[^ ]*serveo.net')
        if [ ! -z "$URL" ]; then
            echo ""
            echo "🎉 SUCCESS! Your MSG Email Automation is LIVE!"
            echo "=============================================="
            echo ""
            echo "🌍 Public URL: $URL"
            echo ""
            echo "📋 Share this URL with anyone:"
            echo "   🔗 $URL"
            echo ""
            echo "✅ No password required!"
            echo "✅ Works from any network!"
            echo "✅ Instant access!"
            echo ""
            echo "💡 Keep this terminal open to maintain the tunnel"
            echo "🛑 Press Ctrl+C to stop"
            echo ""
        fi
    fi
done &

# Function to clean up on exit
cleanup() {
    echo ""
    echo "🛑 Stopping MSG Email Automation..."
    kill $SERVER_PID 2>/dev/null
    pkill -f "ssh.*serveo.net" 2>/dev/null
    echo "✅ Stopped successfully"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep the script running
echo "🔄 Tunnel is active... (Press Ctrl+C to stop)"
wait $SERVER_PID