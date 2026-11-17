# Ubuntu Deployment Guide

## Prerequisites

- Ubuntu 22.04 or later.
- Python 3.12.
- Node.js 20 or later.
- npm and Git.

## Clone and Install

```bash
git clone https://github.com/VeereshMattikalli/secure-api-gateway.git
cd secure-api-gateway
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

## Configure Environment

Create `.env` in the project root:

```env
APP_NAME=Secure API Gateway
APP_VERSION=1.0.0
DEBUG=False
DATABASE_URL=sqlite:///./secure_gateway.db
BACKEND_URL=http://127.0.0.1:8001
HMAC_SECRET=replace_with_generated_secret
DASHBOARD_SESSION_SECRET=replace_with_a_different_generated_secret
```

Generate each secret independently:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Never commit `.env` or share its contents.

## Install Frontend

```bash
cd frontend
npm install
npm run lint
npm run build
cd ..
```

## Start Backend

Terminal 1:

```bash
source .venv/bin/activate
uvicorn app.backend:app --host 127.0.0.1 --port 8001
```

## Start Gateway

Terminal 2:

```bash
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Start Frontend

Terminal 3:

```bash
cd frontend
npm run dev
```

Open the URL displayed by Vite, normally `http://localhost:5173`.

## Create Administrator

From the project root:

```bash
python scripts/generate_client.py --name "Administrator" --role ADMIN
```

Store the generated API key securely. It is displayed only once.

## Verify Services

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8001/health
```

## Production Notes

This is a local service-startup guide, not a complete production deployment. Before public exposure, configure HTTPS, secure cookies, production origins, secret management, firewall rules, backups and monitoring. Do not expose the backend directly to untrusted networks.
