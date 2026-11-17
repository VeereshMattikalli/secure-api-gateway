# Module Documentation

## Backend and Gateway

| Module | File | Responsibility |
|---|---|---|
| Gateway | `app/main.py` | Gateway routes and middleware |
| Backend | `app/backend.py` | Backend API routes |
| Configuration | `app/config.py` | Environment settings |
| Authentication | `app/core/authentication.py` | API key verification |
| Authorization | `app/core/authorization.py` | Role permissions |
| Request signing | `app/core/request_signing.py` | HMAC, timestamp and nonce checks |
| Rate limiter | `app/core/rate_limiter.py` | Sliding-window rate limiting |
| Audit logger | `app/core/audit_logger.py` | Security event logging |
| Dashboard auth | `app/core/dashboard_auth.py` | Admin login and sessions |
| Dashboard data | `app/core/dashboard_data.py` | Statistics, clients and audit data |
| Database | `app/database/db.py` | Database connection |
| Models | `app/database/models.py` | Client and nonce models |

## Frontend

| File | Responsibility |
|---|---|
| `frontend/src/App.jsx` | Dashboard layout and navigation |
| `frontend/src/Login.jsx` | Administrator login |
| `frontend/src/pages/Monitoring.jsx` | Request monitoring |
| `frontend/src/pages/AuditLogs.jsx` | Audit-log viewing |
| `frontend/src/pages/Clients.jsx` | Client information |
| `frontend/src/pages/RateLimits.jsx` | Rate-limit information |
| `frontend/src/pages/Security.jsx` | Security overview |

## Utility Scripts

| Script | Purpose |
|---|---|
| `scripts/generate_client.py` | Create API clients |
| `scripts/test_security.py` | Authentication and HMAC tests |
| `scripts/test_rbac.py` | RBAC tests |
| `scripts/test_rate_limit.py` | Rate-limit tests |
| `scripts/test_dashboard_auth.py` | Dashboard authentication tests |
| `scripts/test_csrf.py` | Origin validation tests |
