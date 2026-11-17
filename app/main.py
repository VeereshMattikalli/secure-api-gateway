import httpx

from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
    Request,
    Header
)

from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.config import settings
from app.database.db import Base, engine, get_db
from app.database.models import Client
from app.core.authentication import get_current_client
from app.core.request_signing import verify_request_signature
from app.core.authorization import require_permission

# Initialize database tables
Base.metadata.create_all(bind=engine)


# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Secure API Gateway with API Key Authentication"
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

    return await forward_to_backend("/products")
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

    return await forward_to_backend("/profile")


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

    return {
        "message": "Analytics data accessed successfully",
        "role": current_client.role,
        "data": {
            "total_requests": 1250,
            "successful_requests": 1190,
            "failed_requests": 60
        }
    }


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

    return {
        "message": "Administrator access granted",
        "role": current_client.role,
        "admin_panel": "Accessible"
    }


# --------------------------------------------------
# Public API endpoint
# --------------------------------------------------

@app.get("/api/public")
def public_endpoint():
    return {
        "message": "This is a public API endpoint",
        "security": "Public endpoint - no API key required"
    }
