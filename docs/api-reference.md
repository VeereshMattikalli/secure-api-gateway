# API Reference

Gateway base URL: `http://127.0.0.1:8000`
Backend URL: `http://127.0.0.1:8001`

## Public Gateway Routes

| Method | Endpoint | Access |
|---|---|---|
| GET | `/` | Public |
| GET | `/health` | Public |
| GET | `/api/public` | Public |

## Protected Gateway Routes

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/products` | USER, ANALYST, ADMIN |
| GET | `/api/profile` | USER, ANALYST, ADMIN |
| GET | `/api/analytics` | ANALYST, ADMIN |
| GET | `/api/admin` | ADMIN |

Protected requests require API-key authentication and HMAC signing.

## Dashboard Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/dashboard/auth/login` | Administrator login |
| POST | `/dashboard/auth/logout` | Logout |
| GET | `/dashboard/auth/me` | Current session |

## Dashboard Data

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/dashboard/stats` | Monitoring statistics |
| GET | `/dashboard/clients` | Client information |
| GET | `/dashboard/audit-logs` | Recent audit events |

Dashboard data routes require an authenticated administrator session.

## Backend Routes

| Method | Endpoint |
|---|---|
| GET | `/` |
| GET | `/health` |
| GET | `/products` |
| GET | `/profile` |

## Protected Request Headers

- `X-API-Key`: client API key.
- `X-Timestamp`: Unix timestamp.
- `X-Nonce`: unique request nonce.
- `X-Signature`: HMAC-SHA256 signature.

Canonical signing message: `METHOD:path:timestamp:nonce`.

The configured timestamp validity window is 60 seconds.

## Common HTTP Status Codes

| Status | Meaning |
|---|---|
| 200 | Success |
| 400 | Invalid input |
| 401 | Authentication or signature failure |
| 403 | Permission or Origin rejection |
| 429 | Rate limit exceeded |
| 500 | Server error |

Interactive API documentation is available at `/docs` on the gateway and backend.
