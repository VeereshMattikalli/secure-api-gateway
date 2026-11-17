import hashlib
import hmac

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, SecretStr
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.database.models import Client
from app.core.audit_logger import log_audit_event


router = APIRouter(
    prefix="/dashboard/auth",
    tags=["Dashboard Authentication"]
)
ALLOWED_DASHBOARD_ORIGIN = "http://localhost:5173"


def require_dashboard_origin(request: Request):
    origin = request.headers.get("origin")

    if origin != ALLOWED_DASHBOARD_ORIGIN:
        raise HTTPException(
            status_code=403,
            detail="Invalid or missing request origin"
        )

class DashboardLoginRequest(BaseModel):
    api_key: SecretStr


def get_dashboard_admin(
    request: Request,
    db: Session = Depends(get_db)
):
    client_id = request.session.get("client_id")

    if not client_id:
        raise HTTPException(
            status_code=401,
            detail="Dashboard login required"
        )

    client = db.query(Client).filter(
        Client.client_id == client_id
    ).first()

    if client is None or not client.is_active:
        request.session.clear()

        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive dashboard session"
        )

    if client.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required"
        )

    request.state.client_id = str(client.client_id)
    request.state.role = client.role

    return client


@router.post("/login")
def dashboard_login(
    login_data: DashboardLoginRequest,
    request: Request,
    db: Session = Depends(get_db),
    _: None = Depends(require_dashboard_origin)
):
    api_key = login_data.api_key.get_secret_value()

    received_hash = hashlib.sha256(
        api_key.encode("utf-8")
    ).hexdigest()

    client = db.query(Client).filter(
        Client.key_hash == received_hash
    ).first()

    client_ip = (
        request.client.host if request.client else None
    )

    if client is None or not hmac.compare_digest(
        client.key_hash,
        received_hash
    ):
        log_audit_event(
            event_type="DASHBOARD_LOGIN_FAILURE",
            description="Invalid dashboard credentials",
            endpoint=request.url.path,
            method=request.method,
            status_code=401,
            ip_address=client_ip
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid administrator credentials"
        )

    if not client.is_active or client.role != "ADMIN":
        log_audit_event(
            event_type="DASHBOARD_LOGIN_FAILURE",
            description="Inactive or non-admin dashboard login attempt",
            client_id=str(client.client_id),
            role=client.role,
            endpoint=request.url.path,
            method=request.method,
            status_code=403,
            ip_address=client_ip
        )

        raise HTTPException(
            status_code=403,
            detail="Administrator access required"
        )

    request.session.clear()
    request.session["client_id"] = str(client.client_id)

    request.state.client_id = str(client.client_id)
    request.state.role = client.role

    log_audit_event(
        event_type="DASHBOARD_LOGIN_SUCCESS",
        description="Administrator logged into dashboard",
        client_id=str(client.client_id),
        role=client.role,
        endpoint=request.url.path,
        method=request.method,
        status_code=200,
        ip_address=client_ip
    )

    return {
        "message": "Dashboard login successful",
        "user": {
            "client_id": str(client.client_id),
            "name": client.name,
            "role": client.role
        }
    }


@router.post("/logout")
def dashboard_logout(
    request: Request,
    _: None = Depends(require_dashboard_origin)
):
    request.session.clear()

    return {
        "message": "Dashboard logout successful"
    }


@router.get("/me")
def dashboard_me(
    current_admin: Client = Depends(get_dashboard_admin)
):
    return {
        "client_id": str(current_admin.client_id),
        "name": current_admin.name,
        "role": current_admin.role
    }
