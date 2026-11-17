
import hashlib
import hmac
import secrets
import time
import requests

from app.config import settings
from app.core.request_signing import generate_signature


GATEWAY_URL = "http://127.0.0.1:8000"


def test_request(api_key, endpoint):
    timestamp = str(int(time.time()))
    nonce = secrets.token_hex(16)

    message = f"GET:{endpoint}:{timestamp}:{nonce}"

    signature = generate_signature(
        settings.HMAC_SECRET,
        message
    )

    response = requests.get(
        GATEWAY_URL + endpoint,
        headers={
            "X-API-Key": api_key,
            "X-Timestamp": timestamp,
            "X-Nonce": nonce,
            "X-Signature": signature
        },
        timeout=10
    )

    return response


def load_client_key(prompt):
    return input(prompt).strip()


if __name__ == "__main__":

    user_key = load_client_key("Enter USER API key: ")
    analyst_key = load_client_key("Enter ANALYST API key: ")
    admin_key = load_client_key("Enter ADMIN API key: ")

    tests = [
        ("USER - Products", user_key, "/api/products", 200),
        ("USER - Analytics", user_key, "/api/analytics", 403),
        ("ANALYST - Analytics", analyst_key, "/api/analytics", 200),
        ("ANALYST - Admin", analyst_key, "/api/admin", 403),
        ("ADMIN - Admin", admin_key, "/api/admin", 200),
    ]

    print("\n========== RBAC TEST RESULTS ==========\n")

    for name, key, endpoint, expected in tests:
        response = test_request(key, endpoint)

        result = "PASS" if response.status_code == expected else "FAIL"

        print(f"{name}: {result}")
        print(f"Expected: {expected}, Actual: {response.status_code}")
        print(f"Response: {response.text}\n")

    print("=======================================")
