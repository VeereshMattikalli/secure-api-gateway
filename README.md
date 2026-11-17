
# Secure API Gateway

A secure API Gateway developed using Python and FastAPI that provides centralized API access control through API key authentication, HMAC-SHA256 request signing, replay attack protection, Role-Based Access Control (RBAC), and role-based rate limiting.

## Project Overview

The Secure API Gateway acts as an intermediary between clients and backend services. It authenticates incoming requests, verifies their integrity, enforces access permissions, and controls request frequency before forwarding authorized requests to backend services.

## Technologies Used

- Python 3.12
- FastAPI
- Uvicorn
- SQLAlchemy
- SQLite
- HTTPX
- HMAC-SHA256
- Git and GitHub

## Features Implemented

### 1. API Gateway and Backend Proxy

- Centralized entry point for client requests.
- Forwards authorized requests to backend services.
- Handles backend timeouts and service errors.

### 2. API Key Authentication

- Authenticates clients using API keys.
- Stores SHA-256 hashes instead of plaintext API keys.
- Supports client activation and deactivation.

### 3. HMAC-SHA256 Request Signing

- Verifies request signatures.
- Uses HTTP method, request path, timestamp, and nonce.
- Rejects invalid signatures and expired timestamps.

### 4. Replay Attack Protection

- Uses unique nonces to identify previously processed requests.
- Rejects duplicate nonces.
- Removes expired nonce records.

### 5. Role-Based Access Control (RBAC)

Three client roles are supported:

| Role | Permissions |
|---|---|
| USER | Basic API access |
| ANALYST | Basic and analytics access |
| ADMIN | Basic, analytics, and administrative access |

### 6. Role-Based Rate Limiting

Implements an in-memory sliding-window rate limiter to control the number of requests made by each authenticated client.

| Role | Request Limit | Time Window |
|---|---:|---:|
| USER | 10 requests | 60 seconds |
| ANALYST | 20 requests | 60 seconds |
| ADMIN | 30 requests | 60 seconds |

Features include:

- Independent request tracking for each client.
- Sliding-window request counting.
- HTTP 429 (Too Many Requests) when the limit is exceeded.
- Retry-After response header.
- X-RateLimit-Limit response header.
- X-RateLimit-Remaining response header.
- X-RateLimit-Reset response header.
- Thread locking for shared in-process request tracking.

## Project Structure

```text
secure-api-gateway/
├── app/
│   ├── core/
│   │   ├── authentication.py
│   │   ├── authorization.py
│   │   ├── rate_limiter.py
│   │   └── request_signing.py
│   ├── database/
│   │   ├── db.py
│   │   └── models.py
│   ├── backend.py
│   ├── config.py
│   └── main.py
├── scripts/
│   ├── generate_client.py
│   ├── test_rbac.py
│   └── test_rate_limit.py
├── .gitignore
├── requirements.txt
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/VeereshMattikalli/secure-api-gateway.git
cd secure-api-gateway
```

### 2. Create a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
APP_NAME=Secure API Gateway
APP_VERSION=1.0.0
DEBUG=True
DATABASE_URL=sqlite:///./secure_gateway.db
BACKEND_URL=http://127.0.0.1:8001
HMAC_SECRET=replace_with_a_secure_64_character_hex_secret
```

Generate a secret locally using:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Use the generated value as HMAC_SECRET. Never commit your `.env` file.

## Running the Application

Start the backend service in Terminal 1:

```bash
uvicorn app.backend:app --host 127.0.0.1 --port 8001
```

Start the API Gateway in Terminal 2:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Gateway URL:

```text
http://127.0.0.1:8000
```

Backend URL:

```text
http://127.0.0.1:8001
```

## API Endpoints

| Method | Endpoint | Access |
|---|---|---|
| GET | / | Public |
| GET | /health | Public |
| GET | /api/public | Public |
| GET | /api/products | USER, ANALYST, ADMIN |
| GET | /api/profile | USER, ANALYST, ADMIN |
| GET | /api/analytics | ANALYST, ADMIN |
| GET | /api/admin | ADMIN |

Protected endpoints require API key authentication and HMAC request signing.

## Client Creation

Generate a client using:

```bash
python scripts/generate_client.py --name "Test User" --role USER
```

Supported roles:

- USER
- ANALYST
- ADMIN

The generated API key is displayed once. Store it securely.

## Testing

### RBAC Testing

```bash
python scripts/test_rbac.py
```

### Rate-Limit Testing

```bash
python scripts/test_rate_limit.py
```

### Rate-Limiting Test Results

| Role | Allowed Requests | Rejected Request | Result |
|---|---:|---:|---|
| USER | 10 | 11th | PASS |
| ANALYST | 20 | 21st | PASS |
| ADMIN | 30 | 31st | PASS |

Excess requests return HTTP 429 Too Many Requests.

## Security Considerations

- API keys are stored as SHA-256 hashes.
- HMAC signatures are compared using constant-time comparison.
- Timestamp validation limits the validity period of signed requests.
- Nonce tracking helps prevent replay attacks.
- RBAC restricts access according to client roles.
- Rate limiting helps prevent excessive API requests.
- Sensitive configuration files and local databases are excluded from Git.

## Current Limitations

- Rate-limit counters are stored in application memory and reset when the gateway restarts.
- Counters are not shared across multiple gateway workers or server instances.
- Redis can be introduced for distributed rate limiting.
- The current backend uses demonstration data.

## Future Enhancements

- Redis-based distributed rate limiting.
- Audit logging and monitoring.
- Admin dashboard and frontend integration.
- Improved security monitoring and automated testing.
- Production deployment with HTTPS.

## Author

**Veeresh Mattikalli**

GitHub: https://github.com/VeereshMattikalli
