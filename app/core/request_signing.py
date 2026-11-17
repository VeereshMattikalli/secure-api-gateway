
import hashlib
import hmac
import time
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.database.models import UsedNonce


def generate_signature(secret: str, message: str) -> str:
    """Generate an HMAC-SHA256 signature."""
    return hmac.new(
        secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


def verify_signature(
    secret: str,
    message: str,
    received_signature: str
) -> bool:
    """Verify an HMAC-SHA256 signature."""
    expected_signature = generate_signature(secret, message)

    return hmac.compare_digest(
        expected_signature,
        received_signature
    )


def verify_request_signature(
    method: str,
    path: str,
    x_signature: str | None,
    x_timestamp: str | None,
    x_nonce: str | None,
    db: Session
):
    """Verify signature, timestamp and nonce."""

    if not x_signature:
        raise HTTPException(
            status_code=401,
            detail="Request signature is missing"
        )

    if not x_timestamp:
        raise HTTPException(
            status_code=401,
            detail="Request timestamp is missing"
        )

    if not x_nonce:
        raise HTTPException(
            status_code=401,
            detail="Request nonce is missing"
        )

    if len(x_nonce) > 64:
        raise HTTPException(
            status_code=400,
            detail="Invalid nonce"
        )

    try:
        timestamp = int(x_timestamp)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid timestamp"
        )

    current_time = int(time.time())

    if abs(current_time - timestamp) > 60:
        raise HTTPException(
            status_code=401,
            detail="Request timestamp expired or invalid"
        )

    canonical_message = (
        f"{method.upper()}:{path}:{x_timestamp}:{x_nonce}"
    )

    if not verify_signature(
        settings.HMAC_SECRET,
        canonical_message,
        x_signature
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid request signature"
        )
    current_datetime = datetime.now(timezone.utc)

    db.query(UsedNonce).filter(
        UsedNonce.expires_at < current_datetime
    ).delete(synchronize_session=False)

    db.commit()

    expires_at = datetime.now(timezone.utc) + timedelta(seconds=60)

    used_nonce = UsedNonce(
        nonce=x_nonce,
        expires_at=expires_at
    )

    try:
        db.add(used_nonce)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=401,
            detail="Replay attack detected: nonce already used"
        )
