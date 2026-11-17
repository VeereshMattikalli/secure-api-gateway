
import hashlib
import hmac

from fastapi import HTTPException, Header, Depends, Request
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.database.models import Client
from app.core.audit_logger import log_audit_event


def get_current_client(
    request: Request,
    x_api_key: str | None = Header(
        default=None,
        alias="X-API-Key"
    ),
    db: Session = Depends(get_db)
):

    client_ip = (
        request.client.host if request.client else None
    )

    # Check whether API key is provided
    if not x_api_key:
        log_audit_event(
            event_type="AUTH_FAILURE",
            description="API key is missing",
            endpoint=request.url.path,
            method=request.method,
            status_code=401,
            ip_address=client_ip
        )

        raise HTTPException(
            status_code=401,
            detail="API key is missing"
        )

    # Calculate hash of the received API key
    received_hash = hashlib.sha256(
        x_api_key.encode("utf-8")
    ).hexdigest()

    # Find the corresponding registered client
    client = db.query(Client).filter(
        Client.key_hash == received_hash
    ).first()

    # Reject invalid API keys
    if client is None:
        log_audit_event(
            event_type="AUTH_FAILURE",
            description="Invalid API key",
            endpoint=request.url.path,
            method=request.method,
            status_code=401,
            ip_address=client_ip
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )

    # Constant-time hash comparison
    if not hmac.compare_digest(
        client.key_hash,
        received_hash
    ):
        log_audit_event(
            event_type="AUTH_FAILURE",
            description="API key verification failed",
            client_id=str(client.client_id),
            role=client.role,
            endpoint=request.url.path,
            method=request.method,
            status_code=401,
            ip_address=client_ip
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )

    # Reject disabled clients
    if not client.is_active:
        log_audit_event(
            event_type="AUTH_FAILURE",
            description="Disabled client attempted authentication",
            client_id=str(client.client_id),
            role=client.role,
            endpoint=request.url.path,
            method=request.method,
            status_code=403,
            ip_address=client_ip
        )

        raise HTTPException(
            status_code=403,
            detail="Client account is disabled"
        )

    # Record successful authentication
    log_audit_event(
        event_type="AUTH_SUCCESS",
        description="Client authenticated successfully",
        client_id=str(client.client_id),
        role=client.role,
        endpoint=request.url.path,
        method=request.method,
        status_code=200,
        ip_address=client_ip
    )

    # Store authenticated client details for audit middleware
    request.state.client_id = str(client.client_id)
    request.state.role = client.role
    return client
