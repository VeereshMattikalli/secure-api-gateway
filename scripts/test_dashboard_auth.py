
import getpass
import sys

import httpx


BASE_URL = "http://127.0.0.1:8000"
DASHBOARD_HEADERS = {
    "Origin": "http://localhost:5173"
}
results = []


def check(name, response, expected_status, extra_check=None):
    passed = response.status_code == expected_status

    if passed and extra_check:
        passed = extra_check(response)

    results.append(passed)

    print(
        f"{name}: {'PASS' if passed else 'FAIL'} "
        f"(Expected: {expected_status}, "
        f"Actual: {response.status_code})"
    )

    if not passed:
        print("Response:", response.text[:500])


def main():
    print("========== DASHBOARD AUTHENTICATION TESTS ==========\n")

    non_admin_key = getpass.getpass("Enter USER or ANALYST API key: ")
    admin_key = getpass.getpass("Enter ADMIN API key: ")

    try:
        # Test 1: Unauthenticated access to /me
        with httpx.Client(base_url=BASE_URL, timeout=10) as client:
            response = client.get("/dashboard/auth/me")
            check(
                "Unauthenticated dashboard access",
                response,
                401
            )

        # Test 2: Invalid API key
        with httpx.Client(base_url=BASE_URL, timeout=10) as client:
            response = client.post(
                "/dashboard/auth/login",
                json={"api_key": "invalid-dashboard-test-key"},
		headers=DASHBOARD_HEADERS
            )
            check(
                "Invalid API key login",
                response,
                401
            )

        # Test 3: Non-admin login
        with httpx.Client(base_url=BASE_URL, timeout=10) as client:
            response = client.post(
                "/dashboard/auth/login",
                json={"api_key": non_admin_key},
		headers=DASHBOARD_HEADERS
            )
            check(
                "Non-admin dashboard login",
                response,
                403
            )

        # Test 4 onwards: Valid admin session
        with httpx.Client(base_url=BASE_URL, timeout=10) as client:

            response = client.post(
                "/dashboard/auth/login",
                json={"api_key": admin_key},
		headers=DASHBOARD_HEADERS
            )

            check(
                "Valid admin login",
                response,
                200,
                lambda r: r.json().get("user", {}).get("role") == "ADMIN"
            )

            if response.status_code != 200:
                print("\nAdmin login failed. Session tests skipped.")
                return

            # Test 5: Verify authenticated admin session
            response = client.get("/dashboard/auth/me")

            check(
                "Authenticated session validation",
                response,
                200,
                lambda r: r.json().get("role") == "ADMIN"
            )

            # Test 6: Access dashboard statistics
            response = client.get("/dashboard/stats")

            check(
                "Admin access to dashboard statistics",
                response,
                200,
                lambda r: "requests" in r.json()
            )

            # Test 7: Access dashboard clients
            response = client.get("/dashboard/clients")

            check(
                "Admin access to client list",
                response,
                200,
                lambda r: "clients" in r.json()
            )

            # Test 8: Access audit logs
            response = client.get("/dashboard/audit-logs?limit=10")

            check(
                "Admin access to audit logs",
                response,
                200,
                lambda r: "logs" in r.json()
            )

            # Test 9: Logout
            response = client.post(
		"/dashboard/auth/logout",
		headers=DASHBOARD_HEADERS)

            check(
                "Dashboard logout",
                response,
                200,
                lambda r: "message" in r.json()
            )

            # Test 10: Verify session is invalid after logout
            response = client.get("/dashboard/auth/me")

            check(
                "Session invalidation after logout",
                response,
                401
            )

    except httpx.ConnectError:
        print("\nERROR: Cannot connect to the gateway.")
        print("Make sure the gateway is running on port 8000.")
        sys.exit(1)

    except httpx.RequestError as error:
        print(f"\nHTTP request error: {error}")
        sys.exit(1)

    print("\n========== TEST SUMMARY ==========")
    passed = sum(results)
    total = len(results)

    print(f"Passed: {passed}/{total}")
    print(f"Failed: {total - passed}/{total}")

    if passed == total:
        print("DASHBOARD AUTHENTICATION TEST: PASS")
    else:
        print("DASHBOARD AUTHENTICATION TEST: FAIL")


if __name__ == "__main__":
    main()
