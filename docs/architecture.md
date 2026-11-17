# System Architecture

## Architecture Diagram

```mermaid
flowchart TB
    C["API Clients"]
    F["React Dashboard :5173"]
    subgraph G["FastAPI Gateway :8000"]
        A["API Key Authentication"]
        H["HMAC Verification"]
        T["Timestamp and Nonce Validation"]
        R["Role-Based Access Control"]
        L["Sliding-Window Rate Limiter"]
        P["Reverse Proxy"]
        D["Dashboard Session Authentication"]
        DD["Dashboard Data API"]
    end
    DB[("SQLite Database")]
    LOG["JSON Audit Logs"]
    B["FastAPI Backend :8001"]

    C --> A --> H --> T --> R --> L --> P --> B
    B --> P --> C
    A -.-> DB
    T -.-> DB
    A -.-> LOG
    H -.-> LOG
    R -.-> LOG
    L -.-> LOG
    F <--> D
    D --> DD
    DD --> DB
    DD --> LOG
```

## Request Flow

1. A client sends a request to the gateway.
2. API key authentication is performed.
3. HMAC signature, timestamp and nonce are validated.
4. RBAC checks the client's permissions.
5. Rate limiting checks the request quota.
6. Authorized requests are forwarded to the backend.
7. The response is returned and relevant events are logged.

## Services

| Service | Port |
|---|---:|
| React frontend | 5173 |
| FastAPI gateway | 8000 |
| FastAPI backend | 8001 |
