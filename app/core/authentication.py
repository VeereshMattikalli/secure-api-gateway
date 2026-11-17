
import hashlib
import hmac

from fastapi import HTTPException, Header, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.database.models import Client


def get_current_client(
    x_api_key: str | None = Header(
        default=None,
        alias="X-API-Key"
    ),
    db: Session = Depends(get_db)
):

    # Check whether API key is provided
    if not x_api_key:
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
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )

    # Constant-time hash comparison
    if not hmac.compare_digest(
        client.key_hash,
        received_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )

    # Reject disabled clients
    if not client.is_active:
        raise HTTPException(
            status_code=403,
            detail="Client account is disabled"
        )

    return client
