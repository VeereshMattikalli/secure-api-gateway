# Security Documentation

## API Key Authentication

Clients authenticate through the `X-API-Key` header. SHA-256 hashes are stored instead of plaintext API keys. Authentication checks client status and uses constant-time comparison.

## HMAC-SHA256

Protected requests are signed using the configured HMAC secret and canonical message `METHOD:path:timestamp:nonce`. The gateway verifies the signature before forwarding requests.

## Timestamp and Replay Protection

Requests must have a valid timestamp within the configured 60-second window. Unique nonces are stored in the database. Repeated nonces are rejected.

## Role-Based Access Control

| Role | Permissions |
|---|---|
| USER | Basic API access |
| ANALYST | Basic and analytics |
| ADMIN | Basic, analytics and admin |

## Rate Limiting

| Role | Limit | Window |
|---|---:|---|
| USER | 10 requests | 60 seconds |
| ANALYST | 20 requests | 60 seconds |
| ADMIN | 30 requests | 60 seconds |

The current limiter uses in-memory counters. Counters reset on restart and are not shared across multiple workers.

## Dashboard Sessions

Dashboard login requires an active ADMIN client. Sessions use signed cookies, a separate session secret, HTTP-only configuration, SameSite=Lax and a 30-minute lifetime. Cookie signing protects integrity, not confidentiality.

## Origin Validation

Dashboard login and logout POST requests validate the Origin header. This is not a complete browser-based CSRF assessment. Future state-changing cookie-authenticated endpoints should implement appropriate CSRF protection.

## Audit Logging

Structured JSON logs record authentication, authorization, rate-limit, request and error events. Sensitive credentials and request bodies should not be logged.

## Production Hardening

Before production deployment:
- Enable HTTPS and secure cookies.
- Set `DEBUG=False`.
- Configure production frontend origins.
- Use secure secret management.
- Consider Redis for distributed rate limiting.
- Evaluate PostgreSQL for production workloads.
- Configure log retention, backups and monitoring.
- Restrict network access to backend services.
