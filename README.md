# Abu Dhabi Malayalees Community Website

A full-stack community website with frontend, REST API backend, PostgreSQL database, and admin panel.

## Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 · CSS3 · Vanilla JS |
| Backend  | Node.js 20 · Express · JWT Auth |
| Database | PostgreSQL 15+ |
| Web Server | Nginx |
| Container | Docker + Docker Compose |

---

## ▶ Quick Deploy (your PC)

### Option 1 — Docker (recommended)

> Requires: Docker Desktop or Docker Engine + Docker Compose

```bash
git clone <repo-url>
cd abu-dhabi-malayalees-community

# First time only: copy env file
cp .env.example .env

# Build and start everything
docker compose up --build -d
```

Open in browser:
- **Website:** http://localhost
- **Admin Panel:** http://localhost/admin/
- **API:** http://localhost/api/health

**Stop:** `docker compose down`
**Logs:** `docker compose logs -f`

---

### Option 2 — Automated native install (Ubuntu / Debian / macOS)

```bash
git clone <repo-url>
cd abu-dhabi-malayalees-community
chmod +x deploy.sh
sudo bash deploy.sh        # Linux
bash deploy.sh             # macOS
```

This script automatically installs and configures PostgreSQL, Node.js, and Nginx.

---

### Option 3 — Manual native install

**Prerequisites:** Node.js 18+, PostgreSQL 14+, Nginx

```bash
# 1. Clone
git clone <repo-url>
cd abu-dhabi-malayalees-community

# 2. Set up database
sudo -u postgres psql << 'SQL'
CREATE USER admc_user WITH PASSWORD 'StrongPass123!';
CREATE DATABASE admc OWNER admc_user;
\c admc
GRANT ALL ON ALL TABLES IN SCHEMA public TO admc_user;
SQL
sudo -u postgres psql -d admc -f backend/db/init.sql

# 3. Configure backend
cp .env.example backend/.env
# Edit backend/.env with your DB credentials

# 4. Install dependencies & start API
cd backend && npm install
node server.js &

# 5. Configure Nginx (see nginx/nginx.conf for reference)
# Copy nginx/nginx.conf to your nginx config directory
# Update root paths to match your install location
nginx
```

---

## Admin Panel

URL: **http://localhost/admin/**
Login: `admin` / `Admin@1234`

| Section | Features |
|---|---|
| Dashboard | Live stats — events, news, members, unread messages |
| Events | Add / edit / delete, featured & published toggle |
| News | Article management with categories |
| Members | Add / edit / search / filter by type & status |
| Leadership | Executive committee with display ordering |
| Contact | View form submissions, mark read, delete |

---

## Project Structure

```
├── frontend/          Static website (HTML/CSS/JS)
├── admin/             Admin panel SPA (HTML/CSS/JS)
├── backend/           Node.js Express API
│   ├── db/
│   │   ├── init.sql   Database schema + seed data
│   │   └── index.js   PostgreSQL pool
│   ├── middleware/
│   │   └── auth.js    JWT middleware
│   └── routes/        auth, events, news, members, leadership, contact
├── nginx/             Nginx Dockerfile + config
├── docker-compose.yml Docker Compose stack
├── deploy.sh          Automated native deploy script
└── .env.example       Environment variable template
```

---

## Environment Variables

Copy `.env.example` to `.env` (or `backend/.env` for native deploy):

| Variable | Description | Default |
|---|---|---|
| `DB_NAME` | PostgreSQL database name | `admc` |
| `DB_USER` | PostgreSQL username | `admc_user` |
| `DB_PASSWORD` | PostgreSQL password | `StrongPass123!` |
| `JWT_SECRET` | Secret for JWT signing | *(change this!)* |
| `ADMIN_USER` | Admin panel username | `admin` |
| `ADMIN_PASS` | Admin panel password | `Admin@1234` |

> **Security:** Change `JWT_SECRET`, `DB_PASSWORD`, and `ADMIN_PASS` before going to production.
