#!/bin/bash

echo "🔓 MSG Email Automation - Fix Tunnel Password Issue"
echo "================================================="

echo "📋 Localtunnel shows password page for security. Here are solutions:"
echo ""

echo "🚀 Option 1: Use alternative tunnel (No password)"
echo "   Bore.pub - No password required"
echo ""

echo "🚀 Option 2: Custom subdomain (Reduces password prompts)"
echo "   Use consistent subdomain name"
echo ""

echo "🚀 Option 3: Different tunnel service"
echo "   Serveo.net - SSH-based, no password"
echo ""

echo "Which solution would you like to try?"
echo "1) Setup Bore.pub tunnel (no password)"
echo "2) Use custom Localtunnel subdomain"
echo "3) Setup Serveo tunnel (no password)"
echo "4) Local network only (no tunnel)"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🌐 Setting up Bore.pub (no password protection)..."
        
        # Check system architecture for correct download
        if [[ $(uname -m) == "arm64" ]]; then
            BORE_URL="https://github.com/ekzhang/bore/releases/download/v0.5.0/bore-v0.5.0-aarch64-apple-darwin.tar.gz"
        else
            BORE_URL="https://github.com/ekzhang/bore/releases/download/v0.5.0/bore-v0.5.0-x86_64-apple-darwin.tar.gz"
        fi
        
        echo "📥 Downloading bore..."
        curl -L "$BORE_URL" -o bore.tar.gz
        
        if [ $? -ne 0 ]; then
            echo "❌ Download failed. Trying alternative method..."
            
            # Alternative: use a simple one-liner for bore
            echo "💡 Using alternative bore installation..."
            curl -L https://github.com/ekzhang/bore/releases/download/v0.5.0/bore-v0.5.0-x86_64-apple-darwin.tar.gz | tar -xz
            
            if [ ! -f "./bore" ]; then
                echo "❌ Could not install bore. Try option 3 (Serveo) instead."
                exit 1
            fi
        else
            tar -xzf bore.tar.gz
            rm bore.tar.gz
        fi
        
        chmod +x ./bore
        
        echo "🔨 Building application..."
        npm run build
        
        echo "🚀 Starting server..."
        npm start &
        SERVER_PID=$!
        
        sleep 5
        
        echo "🌐 Creating bore.pub tunnel (no password required)..."
        ./bore local 3000 --to bore.pub
        ;;
        
    2)
        echo ""
        echo "🌐 Setting up Localtunnel with custom subdomain..."
        echo "💡 Custom subdomains have fewer password prompts"
        
        # Install localtunnel
        npm install localtunnel --save-dev
        
        echo "🔨 Building application..."
        npm run build
        
        echo "🚀 Starting server..."
        npm start &
        SERVER_PID=$!
        
        sleep 5
        
        # Use a more persistent subdomain
        CUSTOM_SUBDOMAIN="msg-email-automation-$(whoami)"
        echo "🌐 Creating tunnel with subdomain: $CUSTOM_SUBDOMAIN"
        
        npx localtunnel --port 3000 --subdomain "$CUSTOM_SUBDOMAIN" &
        TUNNEL_PID=$!
        
        sleep 3
        
        echo ""
        echo "✅ Tunnel created with reduced password prompts!"
        echo "🔗 URL: https://$CUSTOM_SUBDOMAIN.loca.lt"
        echo ""
        echo "💡 If password page still appears:"
        echo "   1. Click 'Click to Continue'"
        echo "   2. Bookmark the URL after first access"
        echo "   3. Use the same subdomain each time"
        
        wait $SERVER_PID
        ;;
        
    3)
        echo ""
        echo "🌐 Setting up Serveo tunnel (SSH-based, no password)..."
        
        echo "🔨 Building application..."
        npm run build
        
        echo "🚀 Starting server..."
        npm start &
        SERVER_PID=$!
        
        sleep 5
        
        echo "🌐 Creating Serveo tunnel..."
        echo "💡 This uses SSH and has no password protection"
        
        # Create serveo tunnel
        ssh -o StrictHostKeyChecking=no -R 80:localhost:3000 serveo.net
        ;;
        
    4)
        echo ""
        echo "🏠 Setting up local network only..."
        
        LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
        
        echo "🔨 Building application..."
        npm run build
        
        echo "🚀 Starting server for local network..."
        echo ""
        echo "📍 Access URLs (no password required):"
        echo "   🖥️  Your Mac:     http://localhost:3000"
        echo "   📱 Same WiFi:     http://$LOCAL_IP:3000"
        echo ""
        echo "⚠️  Note: Only works for users on the same WiFi"
        
        npm start -- --hostname 0.0.0.0 --port 3000
        ;;
        
    *)
        echo "❌ Invalid choice"
        ;;
esac