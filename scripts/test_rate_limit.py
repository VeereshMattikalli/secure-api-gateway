
import hashlib
import hmac
import secrets
import time
import getpass

import requests

BASE_URL = "http://127.0.0.1:8000"
API_ENDPOINT = "/api/products"


def generate_signature(secret, method, path, timestamp, nonce):
    message = f"{method}:{path}:{timestamp}:{nonce}"

    return hmac.new(
        secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


def send_request(api_key, hmac_secret):
    timestamp = str(int(time.time()))
    nonce = secrets.token_hex(16)

    signature = generate_signature(
        hmac_secret,
        "GET",
        API_ENDPOINT,
        timestamp,
        nonce
    )

    headers = {
        "X-API-Key": api_key,
        "X-Signature": signature,
        "X-Timestamp": timestamp,
        "X-Nonce": nonce
    }

    return requests.get(
        BASE_URL + API_ENDPOINT,
        headers=headers,
        timeout=10
    )


def test_role(role, limit):
    print(f"\nTesting {role}: {limit} requests per 60 seconds")
    print("-" * 55)

    api_key = getpass.getpass(f"Enter {role} API key: ")
    hmac_secret = getpass.getpass("Enter HMAC secret: ")

    success_count = 0
    rejected_count = 0

    for i in range(1, limit + 2):
        response = send_request(api_key, hmac_secret)

        remaining = response.headers.get(
            "X-RateLimit-Remaining", "N/A"
        )

        print(
            f"Request {i:02d} | "
            f"Status: {response.status_code} | "
            f"Remaining: {remaining}"
        )

        if response.status_code == 200:
            success_count += 1
        elif response.status_code == 429:
            rejected_count += 1
            print("Rate limit enforced successfully!")
        else:
            print("Unexpected response:", response.text)
            break

    print("-" * 55)

    if success_count == limit and rejected_count >= 1:
        print(f"{role} RATE LIMIT TEST: PASS")
    else:
        print(f"{role} RATE LIMIT TEST: FAIL")

    print(f"Successful requests: {success_count}")
    print(f"Rejected requests: {rejected_count}")


if __name__ == "__main__":
    test_role("ANALYST", 20)
    test_role("ADMIN", 30)
