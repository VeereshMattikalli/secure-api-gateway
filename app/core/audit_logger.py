
import logging
import json
import os

from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler


# Create logs directory if it does not exist
LOG_DIRECTORY = "logs"
os.makedirs(LOG_DIRECTORY, exist_ok=True)

LOG_FILE = os.path.join(LOG_DIRECTORY, "audit.log")


# Configure rotating file handler
file_handler = RotatingFileHandler(
    LOG_FILE,
    maxBytes=5 * 1024 * 1024,
    backupCount=5
)

file_handler.setLevel(logging.INFO)


# Configure log message format
formatter = logging.Formatter("%(message)s")
file_handler.setFormatter(formatter)


# Create audit logger
audit_logger = logging.getLogger("secure_api_audit")
audit_logger.setLevel(logging.INFO)
audit_logger.addHandler(file_handler)

# Prevent duplicate output through the root logger
audit_logger.propagate = False


def log_audit_event(
    event_type: str,
    description: str,
    client_id: str | None = None,
    role: str | None = None,
    endpoint: str | None = None,
    method: str | None = None,
    status_code: int | None = None,
    ip_address: str | None = None
):
    """
    Record a security-related event in structured JSON format.
    """

    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type,
        "description": description,
        "client_id": client_id,
        "role": role,
        "endpoint": endpoint,
        "method": method,
        "status_code": status_code,
        "ip_address": ip_address
    }

    audit_logger.info(
        json.dumps(log_entry)
    )
