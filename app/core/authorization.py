
from fastapi import Depends, HTTPException, status, Request

from app.core.authentication import get_current_client
from app.core.audit_logger import log_audit_event
from app.database.models import Client


# Define role hierarchy
ROLE_PERMISSIONS = {
    "USER": ["basic"],
    "ANALYST": ["basic", "analytics"],
    "ADMIN": ["basic", "analytics", "admin"]
}


def require_permission(permission: str):
    """
    Check whether the authenticated client
    has the required permission.
    """

    def permission_checker(
        request: Request,
        current_client: Client = Depends(get_current_client)
    ):
        allowed_permissions = ROLE_PERMISSIONS.get(
            current_client.role,
            []
        )

        if permission not in allowed_permissions:

            log_audit_event(
                event_type="AUTHORIZATION_DENIED",
                description=(
                    f"Role {current_client.role} "
                    f"does not have permission: {permission}"
                ),
                client_id=str(current_client.client_id),
                role=current_client.role,
                endpoint=request.url.path,
                method=request.method,
                status_code=403,
                ip_address=(
                    request.client.host
                    if request.client else None
                )
            )

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: insufficient permissions"
            )

        return current_client

    return permission_checker
