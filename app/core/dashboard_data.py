import json

from pathlib import Path
from collections import Counter
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.core.dashboard_auth import get_dashboard_admin
from app.database.models import Client


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard Data"]
)

# Resolve the project root independently of the working directory.
PROJECT_ROOT = Path(__file__).resolve().parents[2]
AUDIT_LOG_FILE = PROJECT_ROOT / "logs" / "audit.log"


@router.get("/audit-logs")
def get_dashboard_audit_logs(
    limit: int = Query(default=100, ge=1, le=500),
    current_admin: Client = Depends(get_dashboard_admin)
):
    """
    Return the latest audit log records.
    Administrator session required.
    """

    if not AUDIT_LOG_FILE.exists():
        return {
            "total": 0,
            "logs": []
        }

    records = []

    try:
        with AUDIT_LOG_FILE.open(
            "r",
            encoding="utf-8"
        ) as log_file:

            for line in log_file:
                try:
                    record = json.loads(line)

                    if isinstance(record, dict):
                        records.append(record)

                except json.JSONDecodeError:
                    continue

        # Show newest records first.
        latest_records = list(reversed(records[-limit:]))

        return {
            "total": len(latest_records),
            "logs": latest_records
        }

    except OSError:
        return {
            "total": 0,
            "logs": [],
            "error": "Unable to read audit logs"
        }
@router.get("/clients")
def get_dashboard_clients(
    current_admin: Client = Depends(get_dashboard_admin),
    db: Session = Depends(get_db)
):
    """
    Return registered clients without exposing API key hashes.
    Administrator session required.
    """

    clients = db.query(Client).order_by(
        Client.created_at.desc()
    ).all()

    return {
        "total": len(clients),
        "clients": [
            {
                "client_id": str(client.client_id),
                "name": client.name,
                "role": client.role,
                "is_active": client.is_active,
                "created_at": (
                    client.created_at.isoformat()
                    if client.created_at else None
                )
            }
            for client in clients
        ]
    }
@router.get("/stats")
def get_dashboard_stats(
    current_admin: Client = Depends(get_dashboard_admin),
    db: Session = Depends(get_db)
):
    """
    Calculate gateway statistics from actual audit logs.
    Administrator session required.
    """

    records = []

    if AUDIT_LOG_FILE.exists():
        with AUDIT_LOG_FILE.open(
            "r",
            encoding="utf-8"
        ) as log_file:

            for line in log_file:
                try:
                    record = json.loads(line)

                    if isinstance(record, dict):
                        records.append(record)

                except json.JSONDecodeError:
                    continue

    # Only count gateway API requests, excluding dashboard traffic.
    api_requests = [
        record for record in records
        if record.get("event_type") == "API_REQUEST"
        and not str(record.get("endpoint") or "").startswith("/dashboard/")
    ]

    successful_requests = sum(
        1 for record in api_requests
        if isinstance(record.get("status_code"), int)
        and 200 <= record["status_code"] < 300
    )

    failed_requests = sum(
        1 for record in api_requests
        if isinstance(record.get("status_code"), int)
        and record["status_code"] >= 400
    )

    event_counts = Counter(
        record.get("event_type") for record in records
    )

    total_clients = db.query(Client).count()

    active_clients = db.query(Client).filter(
        Client.is_active.is_(True)
    ).count()

    return {
        "requests": {
            "total": len(api_requests),
            "successful": successful_requests,
            "failed": failed_requests
        },
        "security": {
            "authentication_failures": event_counts["AUTH_FAILURE"],
            "authorization_denials": event_counts["AUTHORIZATION_DENIED"],
            "rate_limit_violations": event_counts["RATE_LIMIT_EXCEEDED"]
        },
        "clients": {
            "total": total_clients,
            "active": active_clients,
            "inactive": total_clients - active_clients
        },
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
