
from fastapi import Depends, HTTPException, status

from app.core.authentication import get_current_client
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
        current_client: Client = Depends(get_current_client)
    ):
        allowed_permissions = ROLE_PERMISSIONS.get(
            current_client.role,
            []
        )

        if permission not in allowed_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: insufficient permissions"
            )

        return current_client

    return permission_checker
