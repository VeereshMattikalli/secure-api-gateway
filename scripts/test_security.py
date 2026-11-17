
import hashlib
import hmac
import secrets
import time
import getpass

import requests

GATEWAY_URL = "http://127.0.0.1:8000"
ENDPOINT = "/api/products"


def generate_signature(secret, method, path, timestamp, nonce):
    message = f"{method}:{path}:{timestamp}:{nonce}"

    return hmac.new(
        secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


def make_headers(api_key, secret, timestamp=None, nonce=None):
    timestamp = str(int(time.time())) if timestamp is None else str(timestamp)
    nonce = secrets.token_hex(16) if nonce is None else nonce

    signature = generate_signature(
        secret, "GET", ENDPOINT, timestamp, nonce
    )

    return {
        "X-API-Key": api_key,
        "X-Timestamp": timestamp,
        "X-Nonce": nonce,
        "X-Signature": signature
    }


def send(headers):
    try:
        return requests.get(
            GATEWAY_URL + ENDPOINT,
            headers=headers,
            timeout=10
        )
    except requests.RequestException as error:
        print(f"Connection error: {error}")
        raise SystemExit(1)


def check(name, response, expected):
    result = "PASS" if response.status_code == expected else "FAIL"

    print(
        f"{name:<35} "
        f"Expected: {expected} | "
        f"Actual: {response.status_code} | {result}"
    )

    if result == "FAIL":
        print("Response:", response.text[:300])


def main():
    print("SECURE API GATEWAY - SECURITY TESTS")
    print("=" * 65)

    api_key = getpass.getpass("Enter a valid USER API key: ")
    secret = getpass.getpass("Enter HMAC secret: ")

    if not api_key or not secret:
        print("Credentials cannot be empty.")
        return

    # 1. Valid request
    response = send(make_headers(api_key, secret))
    check("Valid API key and signature", response, 200)

    # 2. Missing API key
    headers = make_headers(api_key, secret)
    headers.pop("X-API-Key")
    response = send(headers)
    check("Missing API key", response, 401)

    # 3. Invalid API key
    headers = make_headers("invalid-test-api-key", secret)
    response = send(headers)
    check("Invalid API key", response, 401)

    # 4. Missing HMAC signature
    headers = make_headers(api_key, secret)
    headers.pop("X-Signature")
    response = send(headers)
    check("Missing HMAC signature", response, 401)

    # 5. Invalid HMAC signature
    headers = make_headers(api_key, secret)
    headers["X-Signature"] = "0" * 64
    response = send(headers)
    check("Invalid HMAC signature", response, 401)

    # 6. Missing timestamp
    headers = make_headers(api_key, secret)
    headers.pop("X-Timestamp")
    response = send(headers)
    check("Missing timestamp", response, 401)

    # 7. Invalid timestamp format
    headers = make_headers(api_key, secret, timestamp="invalid")
    response = send(headers)
    check("Invalid timestamp format", response, 400)

    # 8. Expired timestamp
    old_timestamp = int(time.time()) - 120
    headers = make_headers(
        api_key, secret, timestamp=old_timestamp
    )
    response = send(headers)
    check("Expired timestamp", response, 401)

    # 9. Missing nonce
    headers = make_headers(api_key, secret)
    headers.pop("X-Nonce")
    response = send(headers)
    check("Missing nonce", response, 401)

    # 10. Nonce exceeding 64 characters
    headers = make_headers(
        api_key, secret, nonce="A" * 65
    )
    response = send(headers)
    check("Nonce longer than 64 characters", response, 400)

    # 11. Replay attack
    replay_nonce = secrets.token_hex(16)
    headers = make_headers(
        api_key, secret, nonce=replay_nonce
    )

    first_response = send(headers)
    check("Replay test - first request", first_response, 200)

    second_response = send(headers)
    check("Replay test - repeated request", second_response, 401)

    print("=" * 65)
    print("SECURITY TESTING COMPLETED")
    print("Review every PASS/FAIL result above.")


if __name__ == "__main__":
    main()
