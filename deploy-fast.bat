@echo off
echo ========================================
echo Fast Deployment via Tarball
echo ========================================
echo.

REM Create tarball excluding node_modules and .next
echo [1/5] Creating tarball (excluding node_modules)...
tar -czf gemini-app.tar.gz --exclude=node_modules --exclude=.next --exclude=.git --exclude=ffmpeg-8.0.1 --exclude=deploy.bat --exclude=deploy-to-vps.sh .

echo [2/5] Uploading tarball to VPS...
scp gemini-app.tar.gz root@69.62.73.115:/tmp/

echo [3/5] Cleaning up failed upload and extracting on VPS...
ssh root@69.62.73.115 "rm -rf /tmp/gemini-upload && mkdir -p /var/www/gemini-chatbot && cd /var/www/gemini-chatbot && tar -xzf /tmp/gemini-app.tar.gz"

echo [4/5] Uploading .env.local file...
scp .env.local root@69.62.73.115:/var/www/gemini-chatbot/

echo [5/5] Running deployment script on VPS...
ssh root@69.62.73.115 "cd /var/www/gemini-chatbot && bash -s" < deploy-vps-final.sh

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Access your application at:
echo http://69.62.73.115:3002
echo.
pause
