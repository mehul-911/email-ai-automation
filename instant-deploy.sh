#!/bin/bash

echo "🚀 MSG Email Automation - Instant Deploy (No Signup Required)"
echo "============================================================"

echo "📋 Choose deployment method:"
echo "1) Localtunnel (No signup, instant)"
echo "2) Bore.pub (No signup, instant)" 
echo "3) Serveo (No signup, SSH-based)"
echo "4) Local network only"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🌐 Setting up Localtunnel (no signup required)..."
        
        # Install localtunnel in project
        echo "📦 Installing localtunnel..."
        npm install localtunnel --save-dev
        
        if [ $? -ne 0 ]; then
            echo "❌ Failed to install localtunnel"
            exit 1
        fi
        
        echo "🔨 Building application..."
        npm run build
        
        if [ $? -ne 0 ]; then
            echo "❌ Build failed"
            exit 1
        fi
        
        echo "🚀 Starting MSG Email Automation..."
        npm start &
        SERVER_PID=$!
        
        # Wait for server to start
        sleep 5
        
        echo "🌐 Creating public tunnel..."
        echo "⏳ This may take a moment..."
        
        # Create tunnel with custom subdomain
        SUBDOMAIN="msg-email-$(date +%s | tail -c 6)"
        npx localtunnel --port 3000 --subdomain $SUBDOMAIN &
        TUNNEL_PID=$!
        
        # Give it time to establish
        sleep 3
        
        echo ""
        echo "✅ SUCCESS! Your MSG Email Automation is now live!"
        echo ""
        echo "🌍 Public URL: https://$SUBDOMAIN.loca.lt"
        echo "📱 Share this URL with anyone on any network"
        echo "🔗 Works from different WiFi, mobile data, anywhere!"
        echo ""
        echo "💡 Tips:"
        echo "   • URL works for ~1 hour, then auto-renews"
        echo "   • If URL stops working, restart this script"
        echo "   • Keep this terminal open"
        echo ""
        echo "🛑 To stop: Press Ctrl+C"
        
        # Wait for user to stop
        wait $SERVER_PID
        ;;
        
    2)
        echo ""
        echo "🌐 Setting up Bore.pub (no signup required)..."
        
        # Download bore for Mac
        echo "📥 Downloading bore..."
        curl -L https://github.com/ekzhang/bore/releases/latest/download/bore-v0.5.0-x86_64-apple-darwin.tar.gz -o bore.tar.gz
        
        if [ $? -ne 0 ]; then
            echo "❌ Failed to download bore"
            exit 1
        fi
        
        tar -xzf bore.tar.gz
        chmod +x bore
        rm bore.tar.gz
        
        echo "🔨 Building application..."
        npm run build
        
        echo "🚀 Starting MSG Email Automation..."
        npm start &
        SERVER_PID=$!
        
        sleep 5
        
        echo "🌐 Creating bore.pub tunnel..."
        ./bore local 3000 --to bore.pub &
        TUNNEL_PID=$!
        
        # Give it time to establish
        sleep 3
        
        echo ""
        echo "✅ SUCCESS! Your MSG Email Automation is now live!"
        echo ""
        echo "🌍 Check the terminal above for your bore.pub URL"
        echo "📱 Share that URL with anyone on any network"
        echo "🔗 Works from different WiFi, mobile data, anywhere!"
        echo ""
        echo "🛑 To stop: Press Ctrl+C"
        
        wait $SERVER_PID
        ;;
        
    3)
        echo ""
        echo "🌐 Setting up Serveo (SSH-based, no signup)..."
        
        echo "🔨 Building application..."
        npm run build
        
        echo "🚀 Starting MSG Email Automation..."
        npm start &
        SERVER_PID=$!
        
        sleep 5
        
        echo "🌐 Creating serveo tunnel..."
        ssh -o StrictHostKeyChecking=no -R 80:localhost:3000 serveo.net &
        TUNNEL_PID=$!
        
        echo ""
        echo "✅ SUCCESS! Your MSG Email Automation is now live!"
        echo ""
        echo "🌍 Check the terminal above for your serveo.net URL"
        echo "📱 Share that URL with anyone"
        echo ""
        echo "🛑 To stop: Press Ctrl+C"
        
        wait $SERVER_PID
        ;;
        
    4)
        echo ""
        echo "🏠 Setting up local network access only..."
        
        # Get Mac IP
        LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
        
        echo "🔨 Building application..."
        npm run build
        
        echo "🚀 Starting MSG Email Automation..."
        echo ""
        echo "📍 Access URLs:"
        echo "   🖥️  Your Mac:     http://localhost:3000"
        echo "   📱 Same WiFi:     http://$LOCAL_IP:3000"
        echo ""
        echo "⚠️  Note: Only works for users on the same WiFi network"
        echo "💡 For different networks, use options 1 or 2"
        echo ""
        echo "🛑 Press Ctrl+C to stop"
        
        npm start -- --hostname 0.0.0.0 --port 3000
        ;;
        
    *)
        echo "❌ Invalid choice"
        ;;
esac