# Secure API Gateway

A secure API Gateway built using **Python, FastAPI and React** that provides centralized API authentication, request integrity verification, access control, rate limiting, audit logging and security monitoring.

The system acts as an intermediary between clients and backend services. It validates incoming requests using API keys and HMAC-SHA256 signatures, prevents replay attacks, enforces role-based permissions and applies rate limits before forwarding authorized requests to backend services.

It also includes a React-based administrator dashboard for monitoring API activity, managing client visibility, reviewing audit logs and inspecting security configurations.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Objectives](#objectives)
3. [Key Features](#key-features)
4. [System Architecture](#system-architecture)
5. [Technology Stack](#technology-stack)
6. [Role-Based Access Control](#role-based-access-control)
7. [Rate Limiting](#rate-limiting)
8. [API Endpoints](#api-endpoints)
9. [Administrator Dashboard](#administrator-dashboard)
10. [Project Structure](#project-structure)
11. [Installation and Configuration](#installation-and-configuration)
12. [Running the Application](#running-the-application)
13. [Creating API Clients](#creating-api-clients)
14. [Request Signing](#request-signing)
15. [Testing](#testing)
16. [Audit Logging](#audit-logging)
17. [Security Considerations](#security-considerations)
18. [Limitations](#limitations)
19. [Future Enhancements](#future-enhancements)

---

## Project Overview

Modern applications frequently expose APIs that communicate with multiple clients and backend services. Without a centralized security mechanism, individual services must independently implement authentication, authorization, request validation and traffic management.

This project addresses that challenge by introducing a centralized Secure API Gateway.

The gateway validates client credentials, verifies signed requests, checks authorization permissions, enforces rate limits and forwards valid requests to the backend service.

An administrator dashboard provides visibility into gateway operations and security-related events.

## Objectives

- Develop a centralized API Gateway using FastAPI.
- Implement API key-based client authentication.
- Protect request integrity using HMAC-SHA256 signatures.
- Prevent replay attacks using timestamps and unique nonces.
- Implement Role-Based Access Control (RBAC).
- Enforce client-specific rate limits.
- Maintain structured security audit logs.
- Develop a React-based security monitoring dashboard.
- Restrict dashboard access to authenticated administrators.
- Test authentication, authorization, request signing and security controls.

## Key Features

### 1. API Gateway and Backend Proxy

- Provides a centralized entry point for API requests.
- Forwards authorized requests to the backend service.
- Separates gateway security logic from backend business functionality.
- Handles backend communication and request errors.

### 2. API Key Authentication

- Authenticates clients using the `X-API-Key` request header.
- Generates cryptographically secure API keys.
- Stores SHA-256 hashes instead of plaintext API keys.
- Supports USER, ANALYST and ADMIN clients.
- Supports client activation and deactivation.
- Uses constant-time hash comparison.

### 3. HMAC-SHA256 Request Signing

- Verifies the authenticity and integrity of incoming requests.
- Uses the HTTP method, request path, timestamp and nonce to construct a canonical message.
- Rejects invalid signatures.
- Rejects missing or invalid timestamps.
- Enforces a 60-second timestamp validity window.

### 4. Replay Attack Protection

- Uses unique nonces to identify previously processed requests.
- Stores used nonces in the database.
- Rejects repeated nonces.
- Removes expired nonce records.

### 5. Role-Based Access Control

Three roles are supported:

| Role | Permissions |
|---|---|
| USER | Basic API access |
| ANALYST | Basic and analytics access |
| ADMIN | Basic, analytics and administrative access |

The gateway checks the client's role before allowing access to protected resources.

### 6. Role-Based Rate Limiting

Implements an in-memory sliding-window rate limiter to control request frequency.

| Role | Request Limit | Time Window |
|---|---:|---:|
| USER | 10 requests | 60 seconds |
| ANALYST | 20 requests | 60 seconds |
| ADMIN | 30 requests | 60 seconds |

Features include:

- Independent request tracking for each client.
- Sliding-window request counting.
- HTTP 429 when the configured limit is exceeded.
- `Retry-After` response header.
- `X-RateLimit-Limit` response header.
- `X-RateLimit-Remaining` response header.
- `X-RateLimit-Reset` response header.
- Thread locking for shared in-process request tracking.

### 7. Audit Logging and Monitoring

The gateway maintains structured JSON audit logs.

Recorded events include:

| Event | Description |
|---|---|
| `AUTH_SUCCESS` | Successful API key authentication |
| `AUTH_FAILURE` | Failed API key authentication |
| `AUTHORIZATION_DENIED` | Access denied due to insufficient permissions |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `API_REQUEST` | API request and response details |
| `REQUEST_ERROR` | Unexpected request-processing error |
| `DASHBOARD_LOGIN_SUCCESS` | Successful administrator login |
| `DASHBOARD_LOGIN_FAILURE` | Failed administrator login |

Audit logging features:

- UTC timestamps.
- Client ID and role tracking.
- Endpoint, HTTP method and status code tracking.
- Request processing time and IP address.
- JSON-formatted records.
- Log rotation with a 5 MB maximum file size and five backup files.
- Sensitive credentials and request bodies are excluded from audit records.

### 8. Administrator Dashboard Authentication

- Administrator login using an ADMIN API key.
- Signed session cookies.
- HTTP-only session cookies.
- Separate dashboard session secret.
- 30-minute session lifetime.
- Session validation on protected dashboard endpoints.
- Logout and session invalidation.
- Origin validation for dashboard login and logout requests.
- Dashboard data endpoints restricted to authenticated administrators.

---

## System Architecture

The system consists of three primary components:

1. React frontend for dashboard interaction.
2. FastAPI API Gateway for security enforcement.
3. FastAPI backend for application data and services.

The API Gateway communicates with the backend only after validating protected requests.

---

## Technology Stack

| Component | Technology |
|---|---|
| Programming Language | Python 3.12 |
| Backend Framework | FastAPI |
| API Gateway | FastAPI |
| ASGI Server | Uvicorn |
| Frontend | React |
| Frontend Build Tool | Vite |
| Styling | CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Database | SQLite |
| ORM | SQLAlchemy |
| Authentication | API Keys |
| Request Signing | HMAC-SHA256 |
| Password/Key Hashing | SHA-256 |
| Session Management | Starlette SessionMiddleware |
| HTTP Communication | HTTPX |
| Testing | Python scripts and HTTPX |
| Version Control | Git and GitHub |

---

## Role-Based Access Control

The gateway implements three access levels.

| API Endpoint | USER | ANALYST | ADMIN |
|---|---|---|---|
| `/api/products` | Allow | Allow | Allow |
| `/api/profile` | Allow | Allow | Allow |
| `/api/analytics` | Deny | Allow | Allow |
| `/api/admin` | Deny | Deny | Allow |

Unauthorized access attempts return HTTP 403 Forbidden.

Unauthenticated or invalid API key requests return HTTP 401 Unauthorized.

---

## Rate Limiting

The gateway implements a sliding-window rate limiter based on authenticated client IDs.

| Role | Maximum Requests | Window |
|---|---:|---:|
| USER | 10 | 60 seconds |
| ANALYST | 20 | 60 seconds |
| ADMIN | 30 | 60 seconds |

When a client exceeds its permitted request count, the gateway responds with:

```http
HTTP/1.1 429 Too Many Requests
```

The response includes rate-limit information to help clients understand their remaining quota and retry timing.

**Implementation note:** The current rate limiter uses in-memory storage. Counters reset when the application restarts and are not shared between multiple gateway worker processes.

---

## API Endpoints

### Public Gateway Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/` | Gateway information | Public |
| GET | `/health` | Gateway health check | Public |
| GET | `/api/public` | Public API example | Public |

### Protected Gateway Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/products` | Retrieve products | All authenticated roles |
| GET | `/api/profile` | Retrieve client profile | All authenticated roles |
| GET | `/api/analytics` | Retrieve analytics information | ANALYST, ADMIN |
| GET | `/api/admin` | Administrator resource | ADMIN |

Protected API endpoints require API key authentication and HMAC request signing.

### Backend Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Backend information |
| GET | `/health` | Backend health check |
| GET | `/products` | Backend product data |
| GET | `/profile` | Backend profile data |

The backend runs independently on port 8001.

### Dashboard Authentication Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/dashboard/auth/login` | Administrator login |
| POST | `/dashboard/auth/logout` | Administrator logout |
| GET | `/dashboard/auth/me` | Validate current administrator session |

### Dashboard Data Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard/stats` | Retrieve monitoring statistics |
| GET | `/dashboard/clients` | Retrieve registered client information |
| GET | `/dashboard/audit-logs` | Retrieve recent audit logs |

All dashboard data endpoints require a valid administrator session.

The audit-log endpoint supports a `limit` query parameter between 1 and 500.

---

## Administrator Dashboard

The React dashboard provides a graphical interface for monitoring gateway security and activity.

### Dashboard Modules

**1. Monitoring**

- Displays request statistics.
- Displays successful and failed requests.
- Displays security event counts.
- Provides request activity charts.
- Displays endpoint-level activity.

**2. Audit Logs**

- Displays recent audit events.
- Supports searching and filtering.
- Displays event types, timestamps and request information.

**3. Clients**

- Displays registered API clients.
- Shows client roles and activation status.
- Displays client counts by role.
- Shows the permissions associated with each role.

**4. Rate Limits**

- Displays configured role-based rate limits.
- Shows the sliding-window configuration.
- Explains HTTP 429 responses and rate-limit behavior.

**5. Security**

- Displays implemented security mechanisms.
- Covers API key authentication.
- Covers HMAC-SHA256 request signing.
- Covers timestamp and nonce validation.
- Covers RBAC, rate limiting and audit logging.

The dashboard uses authenticated requests and does not store administrator API keys in browser local storage.

---

## Project Structure

```text
secure-api-gateway/
│
├── app/
│   ├── core/
│   │   ├── authentication.py
│   │   ├── authorization.py
│   │   ├── request_signing.py
│   │   ├── rate_limiter.py
│   │   ├── audit_logger.py
│   │   ├── dashboard_auth.py
│   │   └── dashboard_data.py
│   │
│   ├── database/
│   │   ├── db.py
│   │   └── models.py
│   │
│   ├── backend.py
│   ├── config.py
│   └── main.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AuditLogs.jsx
│   │   │   ├── Clients.jsx
│   │   │   ├── Monitoring.jsx
│   │   │   ├── RateLimits.jsx
│   │   │   └── Security.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── Login.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── scripts/
│   ├── generate_client.py
│   ├── test_rbac.py
│   ├── test_rate_limit.py
│   ├── test_security.py
│   ├── test_dashboard_auth.py
│   └── test_csrf.py
│
├── logs/
├── tests/
├── .env
├── .gitignore
├── requirements.txt
└── README.md
```

---

## Installation and Configuration

### Prerequisites

- Ubuntu 22.04 or later.
- Python 3.12.
- Node.js 20 or later.
- npm.
- Git.

### 1. Clone the repository

```bash
git clone https://github.com/VeereshMattikalli/secure-api-gateway.git

cd secure-api-gateway
```

### 2. Create a Python virtual environment

```bash
python3 -m venv .venv

source .venv/bin/activate
```

### 3. Install Python dependencies

```bash
pip install --upgrade pip

pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the project root.

```env
APP_NAME=Secure API Gateway
APP_VERSION=1.0.0
DEBUG=True
DATABASE_URL=sqlite:///./secure_gateway.db
BACKEND_URL=http://127.0.0.1:8001
HMAC_SECRET=replace_with_your_generated_hmac_secret
DASHBOARD_SESSION_SECRET=replace_with_a_different_session_secret
```

Generate independent secrets using:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Run this command twice to generate two different secrets.

- Use the first value for `HMAC_SECRET`.
- Use the second value for `DASHBOARD_SESSION_SECRET`.

Never commit `.env` or share its contents.

### 5. Install frontend dependencies

```bash
cd frontend

npm install

cd ..
```

---

## Running the Application

The application uses three separate services.

### Terminal 1 — Backend Service

From the project root:

```bash
cd ~/Desktop/secure-api-gateway

source .venv/bin/activate

uvicorn app.backend:app --host 127.0.0.1 --port 8001 --reload
```

Backend URL:

```text
http://127.0.0.1:8001
```

### Terminal 2 — Secure API Gateway

```bash
cd ~/Desktop/secure-api-gateway

source .venv/bin/activate

uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Gateway URL:

```text
http://127.0.0.1:8000
```

### Terminal 3 — React Dashboard

```bash
cd ~/Desktop/secure-api-gateway/frontend

npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

Open the frontend URL in a browser and log in using a valid ADMIN API key.

### API Documentation

FastAPI automatically provides interactive API documentation.

Gateway Swagger UI:

```text
http://127.0.0.1:8000/docs
```

Backend Swagger UI:

```text
http://127.0.0.1:8001/docs
```

---

## Creating API Clients

Use the client-generation script to register new API clients.

Example:

```bash
python scripts/generate_client.py --name "Test User" --role USER
```

Create an ANALYST:

```bash
python scripts/generate_client.py --name "Analytics Client" --role ANALYST
```

Create an ADMIN:

```bash
python scripts/generate_client.py --name "Administrator" --role ADMIN
```

Supported roles:

- USER
- ANALYST
- ADMIN

The script generates a unique client ID and a cryptographically secure API key.

The API key is displayed once during creation. It is not stored in plaintext in the database.

Store the generated API key securely.

---

## Request Signing

Protected API requests require HMAC-SHA256 signatures.

The canonical message used for signing follows this format:

```text
HTTP_METHOD:REQUEST_PATH:TIMESTAMP:NONCE
```

Example:

```text
GET:/api/products:1730000000:unique_nonce_value
```

The HMAC signature is generated using the configured `HMAC_SECRET`.

Protected requests include these headers:

```http
X-API-Key: <client_api_key>
X-Timestamp: <unix_timestamp>
X-Nonce: <unique_nonce>
X-Signature: <hmac_sha256_signature>
```

The gateway verifies:

1. API key validity.
2. Timestamp presence and format.
3. Timestamp validity within the allowed time window.
4. Nonce presence and length.
5. HMAC-SHA256 signature validity.
6. Nonce uniqueness to prevent replay attacks.

Requests that fail validation are rejected before reaching the backend service.

---

## Testing

The project includes separate scripts for testing security mechanisms.

Run all commands from the project root with the Python virtual environment activated.

### 1. Authentication, HMAC and Replay Protection

```bash
PYTHONPATH=. python3 scripts/test_security.py
```

Tests include:

- Valid API key and signature.
- Missing API key.
- Invalid API key.
- Missing HMAC signature.
- Invalid HMAC signature.
- Missing timestamp.
- Invalid timestamp format.
- Expired timestamp.
- Missing nonce.
- Oversized nonce.
- Replay attack detection.

### 2. Role-Based Access Control

```bash
PYTHONPATH=. python3 scripts/test_rbac.py
```

Verifies access restrictions for USER, ANALYST and ADMIN roles.

### 3. Rate Limiting

```bash
PYTHONPATH=. python3 scripts/test_rate_limit.py
```

Verifies the configured request limits and HTTP 429 responses.

### 4. Dashboard Authentication

```bash
PYTHONPATH=. python3 scripts/test_dashboard_auth.py
```

Tests:

- Unauthenticated access rejection.
- Invalid administrator credentials.
- Non-admin login rejection.
- Successful administrator login.
- Session validation.
- Dashboard statistics access.
- Client list access.
- Audit log access.
- Logout.
- Session invalidation.

### 5. Origin Validation

```bash
PYTHONPATH=. python3 scripts/test_csrf.py
```

Tests:

- Missing Origin header.
- Malicious Origin.
- Unexpected localhost port.
- Permitted frontend Origin.

### 6. Frontend Validation

```bash
cd frontend

npm run lint

npm run build
```

The lint command checks frontend code, and the build command verifies that the React application can be compiled for production.

### Verified Test Results

The following results were observed during project testing:

| Test Category | Result |
|---|---:|
| Authentication, HMAC and replay protection | 12/12 passed |
| RBAC | 5/5 passed |
| Rate limiting | ANALYST and ADMIN tests passed |
| Dashboard authentication | 10/10 passed |
| Origin validation | 4/4 passed |
| Python compilation | Passed |
| Frontend lint and build | Passed |

---

## Audit Logging

Audit logs are stored in:

```text
logs/audit.log
```

The application uses structured JSON records and rotating log files.

Example log structure:

```json
{
  "timestamp": "2026-11-18T10:30:00+00:00",
  "event_type": "AUTH_SUCCESS",
  "description": "API client authenticated successfully",
  "client_id": "client-identifier",
  "role": "USER",
  "endpoint": "/api/products",
  "method": "GET",
  "status_code": 200,
  "ip_address": "127.0.0.1"
}
```

This is an illustrative structure. Actual values depend on the request and event.

Audit logs support security analysis, activity monitoring and troubleshooting.

---

## Security Considerations

The following practices are implemented or configured in the current project:

- API keys are stored as SHA-256 hashes.
- API key comparisons use constant-time comparison.
- HMAC-SHA256 verifies request signatures.
- Timestamps restrict the validity of signed requests.
- Unique nonces prevent repeated signed requests.
- Role-based authorization restricts access to protected endpoints.
- Rate limiting reduces excessive API requests.
- Audit logs provide visibility into security events.
- Dashboard sessions use signed cookies to protect session integrity. Cookie contents are signed, not encrypted.
- Session cookies are configured as HTTP-only and use SameSite=Lax.
- Dashboard session secrets are separate from HMAC secrets.
- Dashboard login and logout enforce Origin validation.
- `.env`, database files and generated logs are excluded from Git.

For production deployment, additional hardening is necessary, including HTTPS, secure cookie settings, production secret management and a shared rate-limiting backend for multiple workers. The current Origin validation protects dashboard login and logout POST requests; future state-changing cookie-authenticated endpoints should also implement appropriate CSRF protection.
---

## Limitations

The current implementation has the following limitations:

1. **In-memory rate limiting:** Rate-limit counters are not persistent and are not shared across multiple gateway workers.
2. **SQLite database:** SQLite is suitable for local development and demonstration but may not be appropriate for high-concurrency production workloads.
3. **Local development configuration:** The current frontend origin and service URLs are configured for local execution.
4. **Audit log statistics:** Dashboard statistics are calculated from the current active audit log file; rotated log files are not included.
5. **Deployment hardening:** Production HTTPS, secure cookie configuration, external secret management and infrastructure-level monitoring must be configured before production use.

---

## Future Enhancements

Potential improvements include:

- Redis-based distributed rate limiting.
- PostgreSQL database integration.
- HTTPS and TLS configuration.
- Docker and Docker Compose deployment.
- Automated CI/CD pipelines.
- Advanced anomaly detection.
- Centralized log aggregation.
- Automated security testing.
- Improved client management with API key rotation.
- More comprehensive browser-based CSRF testing.
- Production monitoring and alerting.

---

## Repository

**GitHub:** https://github.com/VeereshMattikalli/secure-api-gateway

## Conclusion

The Secure API Gateway demonstrates a centralized approach to API security by combining API key authentication, HMAC-SHA256 request signing, replay attack prevention, Role-Based Access Control, rate limiting and audit logging.

The integrated React dashboard provides administrators with visibility into API activity and security events.

The project demonstrates the practical application of backend development, API security, database integration, frontend development and software testing.
