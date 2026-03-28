#!/bin/bash
# Abu Dhabi Malayalees Community — Startup Script
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_API="/tmp/admc-api.log"

echo "========================================="
echo " ADMC — Starting all services"
echo "========================================="

# 1. PostgreSQL
echo "▶ Starting PostgreSQL..."
pg_ctlcluster 16 main start 2>/dev/null || true
sleep 2
pg_lsclusters | grep "online" && echo "✅ PostgreSQL running" || echo "⚠️  PostgreSQL may already be running"

# 2. API Server
echo "▶ Starting API server..."
pkill -f "node server.js" 2>/dev/null || true
sleep 1
cd "$PROJECT_DIR/backend"
nohup node server.js >> "$LOG_API" 2>&1 &
API_PID=$!
echo "  API PID: $API_PID"

# Wait for API to be ready
echo "  Waiting for API..."
for i in $(seq 1 15); do
  sleep 2
  if curl -sf http://127.0.0.1:3000/api/health > /dev/null 2>&1; then
    echo "✅ API running on port 3000"
    break
  fi
  if [ $i -eq 15 ]; then
    echo "❌ API failed to start. Check $LOG_API"
    exit 1
  fi
done

# 3. Nginx
echo "▶ Starting Nginx..."
pkill nginx 2>/dev/null || true
sleep 1
nginx
echo "✅ Nginx running on port 80"

echo ""
echo "========================================="
echo " ✅ All services running!"
echo ""
echo "  🌐 Website:     http://localhost/"
echo "  🔧 Admin Panel: http://localhost/admin/"
echo "  📡 API:         http://localhost/api/health"
echo ""
echo "  Admin login:    admin / Admin@1234"
echo "========================================="
