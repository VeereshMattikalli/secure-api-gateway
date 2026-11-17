# Testing Methodology and Results

Run commands from the project root with `.venv` activated.

## Python Checks

```bash
python -m pip check
python -m compileall -q app scripts
```

## Authentication, HMAC and Replay Protection

```bash
PYTHONPATH=. python scripts/test_security.py
```

Previously observed: 12/12 tests passed.

## RBAC

```bash
PYTHONPATH=. python scripts/test_rbac.py
```

Previously observed: 5/5 tests passed.

## Rate Limiting

```bash
PYTHONPATH=. python scripts/test_rate_limit.py
```

Previously observed: ANALYST 20-request and ADMIN 30-request limits passed.

## Dashboard Authentication

```bash
PYTHONPATH=. python scripts/test_dashboard_auth.py
```

Previously observed: 10/10 tests passed.

## Origin Validation

```bash
PYTHONPATH=. python scripts/test_csrf.py
```

Previously observed: 4/4 tests passed. This tests Origin enforcement, not a complete browser CSRF assessment.

## Frontend

Run from `frontend`:

```bash
npm run lint
npm run build
```

Previously observed: lint passed with zero warnings and errors; production build succeeded with a non-blocking bundle-size warning.

These are previously observed results, not tests rerun by this documentation generator.
