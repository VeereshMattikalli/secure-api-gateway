
import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, status


# Rate limits based on client roles
RATE_LIMITS = {
    "USER": 10,
    "ANALYST": 20,
    "ADMIN": 30
}

# Time window in seconds
WINDOW_SECONDS = 60

# Store request timestamps separately for each client
request_history = defaultdict(deque)

# Protect shared data from concurrent requests
rate_limit_lock = Lock()


def check_rate_limit(client_id: str, role: str):
    """
    Check whether a client has exceeded the allowed
    number of requests within the sliding time window.
    """

    current_time = time.time()

    # Get the request limit for the client's role
    limit = RATE_LIMITS.get(role, RATE_LIMITS["USER"])

    with rate_limit_lock:

        # Get this client's request history
        requests = request_history[client_id]

        # Remove expired requests
        while requests and current_time - requests[0] >= WINDOW_SECONDS:
            requests.popleft()

        # Reject requests when the limit is reached
        if len(requests) >= limit:

            retry_after = max(
                1,
                int(WINDOW_SECONDS - (current_time - requests[0]) + 0.999)
            )

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0"
                }
            )

        # Record the current request
        requests.append(current_time)

        # Calculate remaining requests
        remaining_requests = limit - len(requests)

        # Calculate actual time until the oldest request expires
        reset_after = max(
            1,
            int(WINDOW_SECONDS - (current_time - requests[0]) + 0.999)
        )

        return {
            "limit": limit,
            "remaining": remaining_requests,
            "reset_after": reset_after
        }
