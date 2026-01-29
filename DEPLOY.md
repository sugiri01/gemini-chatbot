# Automated VPS Deployment

This guide shows how to deploy using the automated script.

## Step 1: Upload Files to VPS

**On your Windows machine (PowerShell):**

```powershell
cd H:\Indic-Vercel\gemini-chatbot
scp -r * root@69.62.73.115:/tmp/gemini-upload/
```

Enter password: `Stonecold*12345`

## Step 2: Upload Deployment Script

```powershell
scp deploy-to-vps.sh root@69.62.73.115:/root/
```

## Step 3: Connect to VPS

```powershell
ssh root@69.62.73.115
```

## Step 4: Run Deployment Script

```bash
chmod +x /root/deploy-to-vps.sh
/root/deploy-to-vps.sh
```

The script will:
- ✅ Backup PM2 and Nginx configs
- ✅ Verify chess10 is running
- ✅ Check port 3001 is available
- ✅ Setup Python virtual environment
- ✅ Install Node dependencies
- ✅ Fix Python paths for Linux
- ✅ Build the application
- ✅ Start with PM2 on port 3001
- ✅ Configure Nginx on port 3002
- ✅ Verify both apps are running

## Step 5: Access Your Application

**Chess10 (unchanged):**
```
http://69.62.73.115
```

**Gemini Chatbot (new):**
```
http://69.62.73.115:3002
```

## Troubleshooting

**View logs:**
```bash
pm2 logs gemini-chatbot-3001
```

**Restart app:**
```bash
pm2 restart gemini-chatbot-3001
```

**Check both apps:**
```bash
pm2 ls
curl -I http://127.0.0.1:4100  # chess10
curl -I http://127.0.0.1:3001  # gemini
```
