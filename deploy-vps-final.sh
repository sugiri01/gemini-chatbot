#!/bin/bash
set -e

echo "========================================="
echo "VPS Deployment Script"
echo "========================================="

# Fix Python paths for Linux
echo "[1/7] Fixing Python paths..."
sed -i 's|H:\\2024 Downloads\\ffmpeg.*\\bin|/usr/bin|g' scripts/voice.py

# Setup Python virtual environment
echo "[2/7] Setting up Python environment..."
python3 -m venv .venv
source .venv/bin/activate
pip install --quiet googletrans==4.0.0-rc1 gTTS openai-whisper

# Install Node dependencies
echo "[3/7] Installing Node dependencies..."
npm ci --quiet

# Build application
echo "[4/7] Building Next.js application..."
npm run build

# Start with PM2
echo "[5/7] Starting application with PM2..."
pm2 delete gemini-chatbot-3001 2>/dev/null || true
PORT=3001 pm2 start npm --name "gemini-chatbot-3001" -- start
pm2 save

# Configure Nginx
echo "[6/7] Configuring Nginx..."
cat > /etc/nginx/conf.d/gemini-chatbot.conf << 'EOF'
server {
    listen 3002;
    server_name 69.62.73.115;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

nginx -t && systemctl reload nginx

# Verify
echo "[7/7] Verifying deployment..."
pm2 list

echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo "Application running on port 3001"
echo "Nginx proxy running on port 3002"
echo "Access at: http://69.62.73.115:3002"
