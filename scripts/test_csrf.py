
import httpx

BASE_URL = "http://127.0.0.1:8000"

tests = [
    ("Missing Origin", None),
    ("Malicious Origin", "https://evil.example.com"),
    ("Unexpected localhost port", "http://localhost:3000"),
    ("Allowed frontend Origin", "http://localhost:5173"),
]

print("========== ORIGIN VALIDATION TESTS ==========\n")

passed = 0

for name, origin in tests:
    headers = {}

    if origin is not None:
        headers["Origin"] = origin

    try:
        response = httpx.post(
            f"{BASE_URL}/dashboard/auth/logout",
            headers=headers,
            timeout=10
        )

        expected = 200 if origin == "http://localhost:5173" else 403
        success = response.status_code == expected

        print(
            f"{name}: {'PASS' if success else 'FAIL'} "
            f"(Expected: {expected}, Actual: {response.status_code})"
        )

        if not success:
            print("Response:", response.text[:300])

        if success:
            passed += 1

    except httpx.RequestError as error:
        print(f"{name}: ERROR - {error}")

print("\n========== SUMMARY ==========")
print(f"Passed: {passed}/4")
print(f"Failed: {4 - passed}/4")
