# Limitations and Future Enhancements

## Current Limitations

1. Rate limiting is in-memory and is not shared across workers.
2. SQLite may not suit high-concurrency production workloads.
3. Frontend and service URLs are configured for local development.
4. Dashboard statistics use the active audit log file and do not include rotated logs.
5. Production HTTPS, secure cookies and external secret management require configuration.
6. Current Origin validation covers dashboard login and logout; it is not a complete browser CSRF assessment.
7. The dashboard is application-level monitoring, not full infrastructure monitoring.

## Future Enhancements

- Redis-based distributed rate limiting.
- PostgreSQL integration.
- API key rotation and client lifecycle management.
- Docker and Docker Compose.
- HTTPS deployment automation.
- CI/CD pipelines.
- Centralized log aggregation.
- Infrastructure monitoring and alerting.
- Advanced anomaly detection.
- Browser-based CSRF testing.
- Automated backup and deployment procedures.
