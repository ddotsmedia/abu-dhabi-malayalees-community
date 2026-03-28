#!/bin/bash
# ============================================================
# Abu Dhabi Malayalees Community — One-command deploy script
# Works on Ubuntu / Debian / macOS (with Homebrew)
# Usage:  bash deploy.sh
# ============================================================
set -euo pipefail

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${BLUE}▶ $*${NC}"; }
success() { echo -e "${GREEN}✅ $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠️  $*${NC}"; }
error()   { echo -e "${RED}❌ $*${NC}"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   Abu Dhabi Malayalees Community — Deploy           ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Try Docker first ──────────────────────────────────────
if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  if command -v docker-compose &>/dev/null; then
    COMPOSE="docker-compose"
  elif docker compose version &>/dev/null 2>&1; then
    COMPOSE="docker compose"
  fi

  if [ -n "${COMPOSE:-}" ]; then
    info "Docker detected — deploying with Docker Compose"

    # Copy .env if it doesn't exist
    [ ! -f .env ] && cp .env.example .env && warn "Created .env from .env.example — edit passwords if needed"

    $COMPOSE down --remove-orphans 2>/dev/null || true
    $COMPOSE up --build -d

    info "Waiting for services to be ready..."
    for i in $(seq 1 30); do
      sleep 2
      if curl -sf http://localhost/api/health &>/dev/null; then
        success "All services are running!"
        echo ""
        echo "  🌐  Website:      http://localhost"
        echo "  🔧  Admin Panel:  http://localhost/admin/"
        echo "  📡  API:          http://localhost/api/health"
        echo "  👤  Admin login:  admin / Admin@1234"
        echo ""
        exit 0
      fi
    done
    error "Services did not become healthy in time. Run: $COMPOSE logs"
  fi
fi

warn "Docker not available or not running — deploying natively"
echo ""

OS="$(uname -s)"

# ── Detect package manager ────────────────────────────────
if [[ "$OS" == "Linux" ]]; then
  if command -v apt-get &>/dev/null; then
    PKG_INSTALL="apt-get install -y"
    PKG_UPDATE="apt-get update -qq"
  elif command -v dnf &>/dev/null; then
    PKG_INSTALL="dnf install -y"
    PKG_UPDATE="dnf check-update -q || true"
  else
    error "Unsupported Linux. Please install Node.js 18+, PostgreSQL 14+, and Nginx manually."
  fi
elif [[ "$OS" == "Darwin" ]]; then
  command -v brew &>/dev/null || error "Homebrew required on macOS. Install from https://brew.sh"
  PKG_INSTALL="brew install"
  PKG_UPDATE="brew update"
else
  error "Unsupported OS: $OS"
fi

# ── Install Node.js ───────────────────────────────────────
if ! command -v node &>/dev/null || [[ $(node -e "process.exit(parseInt(process.version.slice(1))<18?1:0)" 2>/dev/null; echo $?) -eq 1 ]]; then
  info "Installing Node.js 20..."
  if [[ "$OS" == "Linux" ]] && command -v apt-get &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - &>/dev/null
    apt-get install -y nodejs &>/dev/null
  elif [[ "$OS" == "Darwin" ]]; then
    brew install node@20 &>/dev/null
    export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
  fi
fi
success "Node.js $(node --version)"

# ── Install PostgreSQL ────────────────────────────────────
if ! command -v psql &>/dev/null; then
  info "Installing PostgreSQL..."
  if [[ "$OS" == "Linux" ]] && command -v apt-get &>/dev/null; then
    $PKG_UPDATE &>/dev/null
    $PKG_INSTALL postgresql postgresql-contrib &>/dev/null
  elif [[ "$OS" == "Darwin" ]]; then
    brew install postgresql@16 &>/dev/null
    export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
  fi
fi
success "PostgreSQL $(psql --version | awk '{print $3}')"

# ── Start PostgreSQL ──────────────────────────────────────
info "Starting PostgreSQL..."
if [[ "$OS" == "Linux" ]]; then
  # Try pg_ctlcluster (Debian/Ubuntu), then pg_ctl
  PG_VER=$(pg_lsclusters 2>/dev/null | awk 'NR==2{print $1}' || psql --version | grep -oP '\d+' | head -1)
  pg_ctlcluster "${PG_VER}" main start 2>/dev/null || \
    service postgresql start 2>/dev/null || \
    pg_ctl -D /var/lib/postgresql/data start 2>/dev/null || true
elif [[ "$OS" == "Darwin" ]]; then
  brew services start postgresql@16 2>/dev/null || true
fi
sleep 3
success "PostgreSQL started"

# ── Set up database ───────────────────────────────────────
info "Setting up database..."
DB_NAME="admc"
DB_USER="admc_user"
DB_PASS="StrongPass123!"

PG_CMD() { sudo -u postgres psql -c "$1" 2>/dev/null || psql -U postgres -c "$1" 2>/dev/null || psql -c "$1" 2>/dev/null; }
PG_CMD_DB() { sudo -u postgres psql -d "$DB_NAME" -c "$1" 2>/dev/null || psql -U postgres -d "$DB_NAME" -c "$1" 2>/dev/null; }

PG_CMD "DROP DATABASE IF EXISTS $DB_NAME;" || true
PG_CMD "DROP USER IF EXISTS $DB_USER;" || true
PG_CMD "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
PG_CMD "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Detect pg host (socket vs TCP)
if PGPASSWORD="$DB_PASS" psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
  PG_HOST="127.0.0.1"
else
  PG_HOST="localhost"
fi

# Run schema
sudo -u postgres psql -d "$DB_NAME" -f "$SCRIPT_DIR/backend/db/init.sql" 2>/dev/null || \
  psql -U postgres -d "$DB_NAME" -f "$SCRIPT_DIR/backend/db/init.sql" 2>/dev/null
PG_CMD_DB "GRANT ALL ON ALL TABLES IN SCHEMA public TO $DB_USER;"
PG_CMD_DB "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"
success "Database ready"

# ── Install npm dependencies ──────────────────────────────
info "Installing backend dependencies..."
cd "$SCRIPT_DIR/backend"
npm install --omit=dev &>/dev/null
success "Dependencies installed"

# ── Write backend .env ────────────────────────────────────
cat > "$SCRIPT_DIR/backend/.env" <<ENV
DB_HOST=$PG_HOST
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
JWT_SECRET=admc-jwt-$(openssl rand -hex 20 2>/dev/null || echo "secret-change-in-production")
ADMIN_USER=admin
ADMIN_PASS=Admin@1234
PORT=3000
NODE_ENV=production
ENV
success ".env written"

# ── Determine web port ────────────────────────────────────
if [[ $EUID -eq 0 ]] || [[ "$OS" == "Darwin" ]] ; then
  WEB_PORT=80
else
  WEB_PORT=8080
  warn "Not running as root — using port 8080 for web server"
fi

# ── Start API ─────────────────────────────────────────────
info "Starting API server on port 3000..."
pkill -f "node server.js" 2>/dev/null || true
sleep 1
cd "$SCRIPT_DIR/backend"
nohup node server.js >> /tmp/admc-api.log 2>&1 &
echo $! > /tmp/admc-api.pid

for i in $(seq 1 15); do
  sleep 2
  if curl -sf http://127.0.0.1:3000/api/health &>/dev/null; then
    success "API running on port 3000"
    break
  fi
  if [[ $i -eq 15 ]]; then
    error "API failed to start. Check /tmp/admc-api.log"
  fi
done

# ── Install & configure Nginx ─────────────────────────────
info "Setting up Nginx..."
if ! command -v nginx &>/dev/null; then
  if [[ "$OS" == "Linux" ]]; then
    $PKG_UPDATE &>/dev/null; $PKG_INSTALL nginx &>/dev/null
  elif [[ "$OS" == "Darwin" ]]; then
    brew install nginx &>/dev/null
  fi
fi

NGINX_CONF_DIR=""
if [[ -d /etc/nginx/sites-available ]]; then
  NGINX_CONF_DIR="/etc/nginx/sites-available"
  NGINX_ENABLED="/etc/nginx/sites-enabled"
elif [[ -d /opt/homebrew/etc/nginx ]]; then
  NGINX_CONF_DIR="/opt/homebrew/etc/nginx/servers"
  NGINX_ENABLED="$NGINX_CONF_DIR"
elif [[ -d /usr/local/etc/nginx ]]; then
  NGINX_CONF_DIR="/usr/local/etc/nginx/servers"
  NGINX_ENABLED="$NGINX_CONF_DIR"
fi

cat > "${NGINX_CONF_DIR}/admc.conf" <<NGINX
server {
    listen ${WEB_PORT} default_server;
    server_name localhost;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    root ${SCRIPT_DIR}/frontend;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /admin/ {
        alias ${SCRIPT_DIR}/admin/;
        index index.html;
        try_files \$uri \$uri/ /admin/index.html;
    }

    location /api/ {
        proxy_pass         http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_read_timeout 60s;
    }
}
NGINX

# Remove default site if present
[ -f "${NGINX_ENABLED}/default" ] && rm -f "${NGINX_ENABLED}/default" || true
[ -d "$NGINX_ENABLED" ] && ln -sf "${NGINX_CONF_DIR}/admc.conf" "${NGINX_ENABLED}/admc.conf" 2>/dev/null || true

nginx -t 2>/dev/null || error "Nginx config invalid. Check ${NGINX_CONF_DIR}/admc.conf"

pkill -f nginx 2>/dev/null || true; sleep 1
if [[ "$OS" == "Darwin" ]]; then
  brew services restart nginx 2>/dev/null || nginx
else
  nginx
fi

sleep 2
if curl -sf http://localhost:${WEB_PORT}/ &>/dev/null; then
  success "Nginx running on port ${WEB_PORT}"
else
  error "Nginx failed to start. Run: nginx -t"
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║             ✅  DEPLOYMENT COMPLETE                  ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
printf "║  🌐  Website:      http://localhost:%-16s║\n" "${WEB_PORT}/"
printf "║  🔧  Admin Panel:  http://localhost:%-16s║\n" "${WEB_PORT}/admin/"
printf "║  📡  API:          http://localhost:%-16s║\n" "${WEB_PORT}/api/health"
echo "║                                                      ║"
echo "║  👤  Admin login:  admin / Admin@1234               ║"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
