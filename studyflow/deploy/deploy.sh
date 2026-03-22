#!/usr/bin/env bash
# deploy.sh — Zero-downtime deploy script
# Run on the VPS as the studyflow user:
#   ssh studyflow@yourdomain.com 'bash /home/studyflow/app/deploy/deploy.sh'

set -euo pipefail

APP_DIR="/home/studyflow/app"

echo "[deploy] Pulling latest code..."
cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main

echo "[deploy] Installing backend dependencies..."
cd "$APP_DIR/backend"
npm ci --omit=dev

echo "[deploy] Building backend..."
npm run build

echo "[deploy] Running database migrations..."
npx drizzle-kit migrate

echo "[deploy] Installing & building frontend..."
cd "$APP_DIR/frontend"
npm ci
npm run build

echo "[deploy] Reloading backend service..."
sudo systemctl reload studyflow-backend || sudo systemctl restart studyflow-backend

echo "[deploy] Verifying health..."
sleep 2
curl -sf http://127.0.0.1:3000/health || (echo "Health check failed!" && exit 1)

echo "[deploy] Done! ✓"
