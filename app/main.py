import httpx

from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
    Request,
    Header
)

from fastapi.responses import Response, JSONResponse
from sqlalchemy.orm import Session
from app.core.dashboard_auth import router as dashboard_auth_router
from app.config import settings
from app.database.db import Base, engine, get_db
from app.core.dashboard_data import router as dashboard_data_router
from app.database.models import Client
from app.core.authentication import get_current_client
from app.core.rate_limiter import check_rate_limit
from app.core.request_signing import verify_request_signature
from app.core.authorization import require_permission
from app.core.audit_logger import log_audit_event
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import time

# Initialize database tables
Base.metadata.create_all(bind=engine)


# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Secure API Gateway with API Key Authentication"
)
# --------------------------------------------------
# Dashboard Session and CORS Middleware
# --------------------------------------------------

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.DASHBOARD_SESSION_SECRET,
    session_cookie="securegate_dashboard_session",
    max_age=1800,
    same_site="lax",
    https_only=False
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"]
)
# Register dashboard authentication routes
app.include_router(dashboard_auth_router)
app.include_router(dashboard_data_router)
# --------------------------------------------------
# Audit Logging Middleware
# --------------------------------------------------

@app.middleware("http")
async def audit_logging_middleware(request: Request, call_next):

    start_time = time.time()
    response = None

    try:
        response = await call_next(request)
        return response

    except Exception:
        log_audit_event(
            event_type="REQUEST_ERROR",
            description="Unexpected error while processing request",
            endpoint=request.url.path,
            method=request.method,
            status_code=500,
            ip_address=request.client.host if request.client else None
        )
        raise

    finally:
        if response is not None:
            processing_time = round(time.time() - start_time, 4)

            log_audit_event(
                event_type="API_REQUEST",
                description=f"Request processed in {processing_time} seconds",
                client_id=getattr(request.state, "client_id", None),
                role=getattr(request.state, "role", None),
                endpoint=request.url.path,
                method=request.method,
                status_code=response.status_code,
                ip_address=request.client.host if request.client else None
            )


# --------------------------------------------------
# Gateway home endpoint
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Welcome to Secure API Gateway",
        "status": "Running",
        "version": settings.APP_VERSION
    }


# --------------------------------------------------
# Gateway health check
# --------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Secure API Gateway"
    }


# --------------------------------------------------
# Backend request forwarding
# --------------------------------------------------

async def forward_to_backend(endpoint: str):

    backend_url = f"{settings.BACKEND_URL}{endpoint}"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:

            response = await client.get(backend_url)

            return Response(
                content=response.content,
                status_code=response.status_code,
                headers={
                    "content-type": response.headers.get(
                        "content-type",
                        "application/json"
                    )
                }
            )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Backend service request timed out"
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Backend service is unavailable"
        )


# --------------------------------------------------
# Protected Products API
@app.get("/api/products")
async def products(
    request: Request,
    current_client: Client = Depends(
        require_permission("basic")
    ),
    x_signature: str | None = Header(default=None, alias="X-Signature"),
    x_timestamp: str | None = Header(default=None, alias="X-Timestamp"),
    x_nonce: str | None = Header(default=None, alias="X-Nonce"),
    db: Session = Depends(get_db)
):
    verify_request_signature(
        request.method,
        request.url.path,
        x_signature,
        x_timestamp,
        x_nonce,
        db
    )
    rate_limit_info = check_rate_limit(
    str(current_client.client_id),
    current_client.role,
    request
)

    response = await forward_to_backend("/products")

    response.headers["X-RateLimit-Limit"] = str(rate_limit_info["limit"])
    response.headers["X-RateLimit-Remaining"] = str(rate_limit_info["remaining"])
    response.headers["X-RateLimit-Reset"] = str(rate_limit_info["reset_after"])

    return response
# --------------------------------------------------

#Protected Profile API
# --------------------------------------------------

@app.get("/api/profile")
async def profile(
    request: Request,
    current_client: Client = Depends(
        require_permission("basic")
    ),
    x_signature: str | None = Header(default=None, alias="X-Signature"),
    x_timestamp: str | None = Header(default=None, alias="X-Timestamp"),
    x_nonce: str | None = Header(default=None, alias="X-Nonce"),
    db: Session = Depends(get_db)
):
    verify_request_signature(
        request.method,
        request.url.path,
        x_signature,
        x_timestamp,
        x_nonce,
        db
    )
    rate_limit_info = check_rate_limit(
    str(current_client.client_id),
    current_client.role,
    request
)

    response = await forward_to_backend("/profile")

    response.headers["X-RateLimit-Limit"] = str(rate_limit_info["limit"])
    response.headers["X-RateLimit-Remaining"] = str(rate_limit_info["remaining"])
    response.headers["X-RateLimit-Reset"] = str(rate_limit_info["reset_after"])

    return response


# --------------------------------------------------
# Analytics API - ANALYST and ADMIN
# --------------------------------------------------

@app.get("/api/analytics")
async def analytics(
    request: Request,
    current_client: Client = Depends(
        require_permission("analytics")
    ),
    x_signature: str | None = Header(default=None, alias="X-Signature"),
    x_timestamp: str | None = Header(default=None, alias="X-Timestamp"),
    x_nonce: str | None = Header(default=None, alias="X-Nonce"),
    db: Session = Depends(get_db)
):
    verify_request_signature(
        request.method,
        request.url.path,
        x_signature,
        x_timestamp,
        x_nonce,
        db
    )

    rate_limit_info = check_rate_limit(
    str(current_client.client_id),
    current_client.role,
    request
)

    return JSONResponse(
        content={
            "message": "Analytics data accessed successfully",
            "role": current_client.role,
            "data": {
                "total_requests": 1250,
                "successful_requests": 1190,
                "failed_requests": 60
            }
        },
        headers={
            "X-RateLimit-Limit": str(rate_limit_info["limit"]),
            "X-RateLimit-Remaining": str(rate_limit_info["remaining"]),
            "X-RateLimit-Reset": str(rate_limit_info["reset_after"])
        }
    )

# --------------------------------------------------
# Admin API - ADMIN only
# --------------------------------------------------

@app.get("/api/admin")
async def admin(
    request: Request,
    current_client: Client = Depends(
        require_permission("admin")
    ),
    x_signature: str | None = Header(default=None, alias="X-Signature"),
    x_timestamp: str | None = Header(default=None, alias="X-Timestamp"),
    x_nonce: str | None = Header(default=None, alias="X-Nonce"),
    db: Session = Depends(get_db)
):
    verify_request_signature(
        request.method,
        request.url.path,
        x_signature,
        x_timestamp,
        x_nonce,
        db
    )

    rate_limit_info = check_rate_limit(
    str(current_client.client_id),
    current_client.role,
    request
)

    return JSONResponse(
        content={
            "message": "Administrator access granted",
            "role": current_client.role,
            "admin_panel": "Accessible"
        },
        headers={
            "X-RateLimit-Limit": str(rate_limit_info["limit"]),
            "X-RateLimit-Remaining": str(rate_limit_info["remaining"]),
            "X-RateLimit-Reset": str(rate_limit_info["reset_after"])
        }
    )


# --------------------------------------------------
# Public API endpoint
# --------------------------------------------------

@app.get("/api/public")
def public_endpoint():
    return {
        "message": "This is a public API endpoint",
        "security": "Public endpoint - no API key required"
    }
