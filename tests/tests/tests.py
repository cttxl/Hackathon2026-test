"""
Full API Test Suite for the Logistics System.
Covers all endpoints described in the API documentation.
Run with: python tests.py
"""

import requests
import sys
from datetime import datetime, timedelta, timezone

BASE_URL = "http://backend:8080"

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"

_results = {"passed": 0, "failed": 0}


def check(name: str, condition: bool, detail: str = ""):
    if condition:
        _results["passed"] += 1
        print(f"  [{PASS}] {name}")
    else:
        _results["failed"] += 1
        print(f"  [{FAIL}] {name}" + (f" — {detail}" if detail else ""))


def section(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def admin_login() -> dict:
    """Return Authorization header for the admin user."""
    resp = requests.post(f"{BASE_URL}/login", json={"email": "admin@admin.com", "password": "1111"})
    assert resp.status_code == 200, f"Admin login failed: {resp.status_code} {resp.text}"
    token = resp.json().get("token")
    assert token, "No token in login response"
    return {"Authorization": f"Bearer {token}"}


def assert_envelope(resp) -> list:
    """Assert paginated envelope shape and return the data list."""
    check("status 200", resp.status_code == 200, f"got {resp.status_code}")
    body = resp.json()
    check("envelope has 'data'", "data" in body, str(body))
    check("envelope has 'meta'", "meta" in body, str(body))
    meta = body.get("meta", {})
    check("meta has 'page'", "page" in meta)
    check("meta has 'limit'", "limit" in meta)
    check("meta has 'total'", "total" in meta)
    return body.get("data", [])


def assert_error(resp, expected_status: int):
    check(f"status {expected_status}", resp.status_code == expected_status, f"got {resp.status_code}")
    body = resp.json()
    check("error key present", "error" in body, str(body))


# ──────────────────────────────────────────────
# 0 · Auth
# ──────────────────────────────────────────────

def test_auth():
    section("0 · Authentication")

    # valid login
    resp = requests.post(f"{BASE_URL}/login", json={"email": "admin@admin.com", "password": "1111"})
    check("POST /login valid credentials → 200", resp.status_code == 200)
    check("response contains token", "token" in resp.json())

    # wrong password
    resp = requests.post(f"{BASE_URL}/login", json={"email": "admin@admin.com", "password": "wrong"})
    check("POST /login wrong password → 4xx", resp.status_code in (400, 401, 403))

    # missing fields
    resp = requests.post(f"{BASE_URL}/login", json={"email": "admin@admin.com"})
    check("POST /login missing password → 4xx", resp.status_code in (400, 401, 422))


# ──────────────────────────────────────────────
# 2.1 · Employees
# ──────────────────────────────────────────────

def test_employees(h: dict) -> str:
    """Returns created employee id."""
    section("2.1 · Employees")

    payload = {
        "fullname": "Test Driver",
        "email": "testdriver_unique_99@example.com",
        "password": "password123",
        "phone": "+380991234567",
        "role": "driver"
    }

    # CREATE
    resp = requests.post(f"{BASE_URL}/employees", json=payload, headers=h)
    check("POST /employees → 201", resp.status_code in (200, 201), f"{resp.status_code} {resp.text}")
    emp_id = resp.json().get("id", "")
    check("response has id", bool(emp_id))

    # CREATE – duplicate email
    resp2 = requests.post(f"{BASE_URL}/employees", json=payload, headers=h)
    check("POST /employees duplicate email → 4xx", resp2.status_code in (400, 409, 422))

    # CREATE – invalid role
    bad = {**payload, "email": "badrole@example.com", "role": "superuser"}
    resp3 = requests.post(f"{BASE_URL}/employees", json=bad, headers=h)
    check("POST /employees invalid role → 4xx", resp3.status_code in (400, 422))

    # CREATE – invalid phone
    bad2 = {**payload, "email": "badphone@example.com", "phone": "not-a-phone"}
    resp4 = requests.post(f"{BASE_URL}/employees", json=bad2, headers=h)
    check("POST /employees invalid phone → 4xx", resp4.status_code in (400, 422))

    # LIST
    resp = requests.get(f"{BASE_URL}/employees", headers=h)
    data = assert_envelope(resp)
    check("GET /employees returns list", isinstance(data, list))

    # LIST pagination
    resp = requests.get(f"{BASE_URL}/employees", headers=h, params={"page": 1, "limit": 5})
    check("GET /employees ?page&limit → 200", resp.status_code == 200)

    # GET by id
    resp = requests.get(f"{BASE_URL}/employees/{emp_id}", headers=h)
    check("GET /employees/{id} → 200", resp.status_code == 200)
    check("correct id returned", resp.json().get("id") == emp_id)

    # GET – not found
    resp = requests.get(f"{BASE_URL}/employees/00000000-0000-0000-0000-000000000000", headers=h)
    check("GET /employees/unknown → 404", resp.status_code == 404)

    # PATCH
    resp = requests.patch(f"{BASE_URL}/employees/{emp_id}", json={"fullname": "Updated Driver"}, headers=h)
    check("PATCH /employees/{id} → 200", resp.status_code == 200)
    check("fullname updated", resp.json().get("fullname") == "Updated Driver")

    # DELETE
    resp = requests.delete(f"{BASE_URL}/employees/{emp_id}", headers=h)
    check("DELETE /employees/{id} → 204", resp.status_code == 204)

    # Confirm deleted
    resp = requests.get(f"{BASE_URL}/employees/{emp_id}", headers=h)
    check("GET deleted employee → 404", resp.status_code == 404)

    # Re-create for later use and return id
    payload["email"] = "testdriver_for_tests@example.com"
    resp = requests.post(f"{BASE_URL}/employees", json=payload, headers=h)
    return resp.json().get("id", "")


# ──────────────────────────────────────────────
# 2.2 · Clients
# ──────────────────────────────────────────────

def test_clients(h: dict) -> str:
    """Returns created client id."""
    section("2.2 · Clients")

    payload = {
        "name": "Test Client Corp",
        "password": "password123",
        "email": "testclient_unique_99@example.com",
        "phone": "+380501112233"
    }

    # CREATE
    resp = requests.post(f"{BASE_URL}/clients", json=payload, headers=h)
    check("POST /clients → 201", resp.status_code in (200, 201), f"{resp.status_code} {resp.text}")
    client_id = resp.json().get("id", "")
    check("response has id", bool(client_id))

    # CREATE – duplicate email
    resp2 = requests.post(f"{BASE_URL}/clients", json=payload, headers=h)
    check("POST /clients duplicate email → 4xx", resp2.status_code in (400, 409, 422))

    # CREATE – invalid email
    bad = {**payload, "email": "not-an-email"}
    resp3 = requests.post(f"{BASE_URL}/clients", json=bad, headers=h)
    check("POST /clients invalid email → 4xx", resp3.status_code in (400, 422))

    # LIST
    resp = requests.get(f"{BASE_URL}/clients", headers=h)
    data = assert_envelope(resp)
    check("GET /clients returns list", isinstance(data, list))

    # GET by id
    resp = requests.get(f"{BASE_URL}/clients/{client_id}", headers=h)
    check("GET /clients/{id} → 200", resp.status_code == 200)
    check("correct id returned", resp.json().get("id") == client_id)

    # PATCH
    resp = requests.patch(f"{BASE_URL}/clients/{client_id}", json={"name": "Updated Client"}, headers=h)
    check("PATCH /clients/{id} → 200", resp.status_code == 200)
    check("name updated", resp.json().get("name") == "Updated Client")

    # DELETE
    resp = requests.delete(f"{BASE_URL}/clients/{client_id}", headers=h)
    check("DELETE /clients/{id} → 204", resp.status_code == 204)

    # Confirm deleted
    resp = requests.get(f"{BASE_URL}/clients/{client_id}", headers=h)
    check("GET deleted client → 404", resp.status_code == 404)

    # Re-create for later use
    payload["email"] = "testclient_for_tests@example.com"
    resp = requests.post(f"{BASE_URL}/clients", json=payload, headers=h)
    return resp.json().get("id", "")


# ──────────────────────────────────────────────
# 2.3 · Delivery Points
# ──────────────────────────────────────────────

def test_delivery_points(h: dict, client_id: str) -> str:
    """Returns created delivery point id."""
    section("2.3 · Delivery Points")

    payload = {
        "name": "Test Warehouse",
        "address": "вул. Тестова, 1, Львів",
        "owner_id": client_id,
        "type": "warehouse",
        "height": 500,
        "width": 1000,
        "length": 2000
    }

    # CREATE
    resp = requests.post(f"{BASE_URL}/delivery-points", json=payload, headers=h)
    check("POST /delivery-points → 201", resp.status_code in (200, 201), f"{resp.status_code} {resp.text}")
    dp_id = resp.json().get("id", "")
    check("response has id", bool(dp_id))

    # CREATE – invalid type
    bad = {**payload, "type": "moon_base"}
    resp2 = requests.post(f"{BASE_URL}/delivery-points", json=bad, headers=h)
    check("POST /delivery-points invalid type → 4xx", resp2.status_code in (400, 422))

    # CREATE – missing owner_id
    bad2 = {k: v for k, v in payload.items() if k != "owner_id"}
    resp3 = requests.post(f"{BASE_URL}/delivery-points", json=bad2, headers=h)
    check("POST /delivery-points missing owner_id → 4xx", resp3.status_code in (400, 422))

    # LIST
    resp = requests.get(f"{BASE_URL}/delivery-points", headers=h)
    data = assert_envelope(resp)
    check("GET /delivery-points returns list", isinstance(data, list))

    # LIST filter by type
    resp = requests.get(f"{BASE_URL}/delivery-points", headers=h, params={"type": "warehouse"})
    check("GET /delivery-points ?type=warehouse → 200", resp.status_code == 200)
    items = resp.json().get("data", [])
    check("all returned are warehouses", all(i.get("type") == "warehouse" for i in items))

    # LIST filter by owner_id
    resp = requests.get(f"{BASE_URL}/delivery-points", headers=h, params={"owner_id": client_id})
    check("GET /delivery-points ?owner_id → 200", resp.status_code == 200)

    # GET by id
    resp = requests.get(f"{BASE_URL}/delivery-points/{dp_id}", headers=h)
    check("GET /delivery-points/{id} → 200", resp.status_code == 200)
    check("correct id returned", resp.json().get("id") == dp_id)

    # PATCH
    resp = requests.patch(f"{BASE_URL}/delivery-points/{dp_id}", json={"name": "Updated Warehouse"}, headers=h)
    check("PATCH /delivery-points/{id} → 200", resp.status_code == 200)
    check("name updated", resp.json().get("name") == "Updated Warehouse")

    # DELETE
    resp = requests.delete(f"{BASE_URL}/delivery-points/{dp_id}", headers=h)
    check("DELETE /delivery-points/{id} → 204", resp.status_code == 204)

    # Confirm deleted
    resp = requests.get(f"{BASE_URL}/delivery-points/{dp_id}", headers=h)
    check("GET deleted dp → 404", resp.status_code == 404)

    # Re-create for later use
    resp = requests.post(f"{BASE_URL}/delivery-points", json={**payload, "name": "Test Warehouse For Tests"}, headers=h)
    return resp.json().get("id", "")


# ──────────────────────────────────────────────
# 2.4 · Products
# ──────────────────────────────────────────────

def test_products(h: dict) -> str:
    """Returns created product id."""
    section("2.4 · Products")

    payload = {
        "name": "Test Product Steel Pipes",
        "weight": 200,
        "height": 50,
        "width": 50,
        "length": 500
    }

    # CREATE
    resp = requests.post(f"{BASE_URL}/products", json=payload, headers=h)
    check("POST /products → 201", resp.status_code in (200, 201), f"{resp.status_code} {resp.text}")
    prod_id = resp.json().get("id", "")
    check("response has id", bool(prod_id))

    # CREATE – missing required field
    bad = {k: v for k, v in payload.items() if k != "weight"}
    resp2 = requests.post(f"{BASE_URL}/products", json=bad, headers=h)
    check("POST /products missing weight → 4xx", resp2.status_code in (400, 422))

    # LIST
    resp = requests.get(f"{BASE_URL}/products", headers=h)
    data = assert_envelope(resp)
    check("GET /products returns list", isinstance(data, list))

    # GET by id
    resp = requests.get(f"{BASE_URL}/products/{prod_id}", headers=h)
    check("GET /products/{id} → 200", resp.status_code == 200)
    check("correct id returned", resp.json().get("id") == prod_id)

    # GET – not found
    resp = requests.get(f"{BASE_URL}/products/00000000-0000-0000-0000-000000000000", headers=h)
    check("GET /products/unknown → 404", resp.status_code == 404)

    # PATCH
    resp = requests.patch(f"{BASE_URL}/products/{prod_id}", json={"name": "Updated Product"}, headers=h)
    check("PATCH /products/{id} → 200", resp.status_code == 200)
    check("name updated", resp.json().get("name") == "Updated Product")

    # DELETE
    resp = requests.delete(f"{BASE_URL}/products/{prod_id}", headers=h)
    check("DELETE /products/{id} → 204", resp.status_code == 204)

    # Re-create for later use
    resp = requests.post(f"{BASE_URL}/products", json={**payload, "name": "Test Product For Tests"}, headers=h)
    return resp.json().get("id", "")


# ──────────────────────────────────────────────
# 2.5 · SKU
# ──────────────────────────────────────────────

def test_sku(h: dict, product_id: str, dp_id: str) -> str:
    """Returns created SKU id."""
    section("2.5 · SKU")

    payload = {
        "product_id": product_id,
        "delivery_point_id": dp_id
    }

    # CREATE
    resp = requests.post(f"{BASE_URL}/sku", json=payload, headers=h)
    check("POST /sku → 201", resp.status_code in (200, 201), f"{resp.status_code} {resp.text}")
    sku_id = resp.json().get("id", "")
    check("response has id", bool(sku_id))

    # CREATE – missing product_id
    bad = {"delivery_point_id": dp_id}
    resp2 = requests.post(f"{BASE_URL}/sku", json=bad, headers=h)
    check("POST /sku missing product_id → 4xx", resp2.status_code in (400, 422))

    # CREATE – invalid product_id
    bad2 = {"product_id": "not-a-uuid", "delivery_point_id": dp_id}
    resp3 = requests.post(f"{BASE_URL}/sku", json=bad2, headers=h)
    check("POST /sku invalid product_id → 4xx", resp3.status_code in (400, 422))

    # LIST
    resp = requests.get(f"{BASE_URL}/sku", headers=h)
    data = assert_envelope(resp)
    check("GET /sku returns list", isinstance(data, list))

    # LIST filter by product_id
    resp = requests.get(f"{BASE_URL}/sku", headers=h, params={"product_id": product_id})
    check("GET /sku ?product_id → 200", resp.status_code == 200)

    # LIST filter by delivery_point_id
    resp = requests.get(f"{BASE_URL}/sku", headers=h, params={"delivery_point_id": dp_id})
    check("GET /sku ?delivery_point_id → 200", resp.status_code == 200)

    # GET by id
    resp = requests.get(f"{BASE_URL}/sku/{sku_id}", headers=h)
    check("GET /sku/{id} → 200", resp.status_code == 200)
    check("correct id returned", resp.json().get("id") == sku_id)

    # DELETE
    resp = requests.delete(f"{BASE_URL}/sku/{sku_id}", headers=h)
    check("DELETE /sku/{id} → 204", resp.status_code == 204)

    # Re-create for later use
    resp = requests.post(f"{BASE_URL}/sku", json=payload, headers=h)
    return resp.json().get("id", "")


# ──────────────────────────────────────────────
# 2.6 · Requests (Orders)
# ──────────────────────────────────────────────

def test_requests(h: dict, product_id: str, dp_id: str, sku_id: str) -> str:
    """Returns created request id."""
    section("2.6 · Requests (Orders)")

    payload = {
        "product_id": product_id,
        "quantity": 10,
        "delivery_point_id": dp_id,
        "emergency": "default"
    }

    # CREATE
    resp = requests.post(f"{BASE_URL}/requests", json=payload, headers=h)
    check("POST /requests → 201", resp.status_code in (200, 201), f"{resp.status_code} {resp.text}")
    req_id = resp.json().get("id", "")
    check("response has id", bool(req_id))
    check("status defaults to pending", resp.json().get("status") == "pending")

    # CREATE – missing quantity
    bad = {k: v for k, v in payload.items() if k != "quantity"}
    resp2 = requests.post(f"{BASE_URL}/requests", json=bad, headers=h)
    check("POST /requests missing quantity → 4xx", resp2.status_code in (400, 422))

    # CREATE – invalid emergency
    bad2 = {**payload, "emergency": "super_ultra"}
    resp3 = requests.post(f"{BASE_URL}/requests", json=bad2, headers=h)
    check("POST /requests invalid emergency → 4xx", resp3.status_code in (400, 422))

    # LIST
    resp = requests.get(f"{BASE_URL}/requests", headers=h)
    data = assert_envelope(resp)
    check("GET /requests returns list", isinstance(data, list))

    # LIST filter by product_id
    resp = requests.get(f"{BASE_URL}/requests", headers=h, params={"product_id": product_id})
    check("GET /requests ?product_id → 200", resp.status_code == 200)

    # LIST filter by delivery_point_id
    resp = requests.get(f"{BASE_URL}/requests", headers=h, params={"delivery_point_id": dp_id})
    check("GET /requests ?delivery_point_id → 200", resp.status_code == 200)

    # LIST filter by status
    resp = requests.get(f"{BASE_URL}/requests", headers=h, params={"status": "pending"})
    check("GET /requests ?status=pending → 200", resp.status_code == 200)

    # LIST filter by sku_id
    resp = requests.get(f"{BASE_URL}/requests", headers=h, params={"sku_id": sku_id})
    check("GET /requests ?sku_id → 200", resp.status_code == 200)

    # GET by id
    resp = requests.get(f"{BASE_URL}/requests/{req_id}", headers=h)
    check("GET /requests/{id} → 200", resp.status_code == 200)
    check("correct id returned", resp.json().get("id") == req_id)

    # GET – not found
    resp = requests.get(f"{BASE_URL}/requests/00000000-0000-0000-0000-000000000000", headers=h)
    check("GET /requests/unknown → 404", resp.status_code == 404)

    # PATCH status
    resp = requests.patch(f"{BASE_URL}/requests/{req_id}", json={"status": "accepted"}, headers=h)
    check("PATCH /requests/{id} status → 200", resp.status_code == 200)
    check("status updated to accepted", resp.json().get("status") == "accepted")

    # PATCH invalid status
    resp = requests.patch(f"{BASE_URL}/requests/{req_id}", json={"status": "flying"}, headers=h)
    check("PATCH /requests/{id} invalid status → 4xx", resp.status_code in (400, 422))

    # DELETE
    resp = requests.delete(f"{BASE_URL}/requests/{req_id}", headers=h)
    check("DELETE /requests/{id} → 204", resp.status_code == 204)

    # Re-create for later use
    resp = requests.post(f"{BASE_URL}/requests", json=payload, headers=h)
    return resp.json().get("id", "")


# ──────────────────────────────────────────────
# 2.9 · Vehicles
# ──────────────────────────────────────────────

def test_vehicles(h: dict) -> str:
    """Returns created vehicle id."""
    section("2.9 · Vehicles")

    payload = {
        "name": "Test Volvo Truck",
        "fuel_type": "diesel",
        "fuel_consumption": 25,
        "max_weight": 20000,
        "max_height": 400,
        "max_width": 250,
        "max_length": 1200,
        "address": "Test Depot 1, Lviv"
    }

    # CREATE
    resp = requests.post(f"{BASE_URL}/vehicles", json=payload, headers=h)
    check("POST /vehicles → 201", resp.status_code in (200, 201), f"{resp.status_code} {resp.text}")
    vehicle_id = resp.json().get("id", "")
    check("response has id", bool(vehicle_id))

    # CREATE – invalid fuel_type
    bad = {**payload, "name": "Bad Vehicle", "fuel_type": "nuclear"}
    resp2 = requests.post(f"{BASE_URL}/vehicles", json=bad, headers=h)
    check("POST /vehicles invalid fuel_type → 4xx", resp2.status_code in (400, 422))

    # CREATE – missing address
    bad2 = {k: v for k, v in payload.items() if k != "address"}
    bad2["name"] = "No Address Vehicle"
    resp3 = requests.post(f"{BASE_URL}/vehicles", json=bad2, headers=h)
    check("POST /vehicles missing address → 4xx", resp3.status_code in (400, 422))

    # LIST
    resp = requests.get(f"{BASE_URL}/vehicles", headers=h)
    data = assert_envelope(resp)
    check("GET /vehicles returns list", isinstance(data, list))

    # LIST pagination
    resp = requests.get(f"{BASE_URL}/vehicles", headers=h, params={"page": 1, "limit": 5})
    check("GET /vehicles ?page&limit → 200", resp.status_code == 200)

    # GET by id
    resp = requests.get(f"{BASE_URL}/vehicles/{vehicle_id}", headers=h)
    check("GET /vehicles/{id} → 200", resp.status_code == 200)
    check("correct id returned", resp.json().get("id") == vehicle_id)

    # GET – not found
    resp = requests.get(f"{BASE_URL}/vehicles/00000000-0000-0000-0000-000000000000", headers=h)
    check("GET /vehicles/unknown → 404", resp.status_code == 404)

    # PATCH
    resp = requests.patch(f"{BASE_URL}/vehicles/{vehicle_id}", json={"name": "Updated Volvo"}, headers=h)
    check("PATCH /vehicles/{id} → 200", resp.status_code == 200)
    check("name updated", resp.json().get("name") == "Updated Volvo")

    # DELETE
    resp = requests.delete(f"{BASE_URL}/vehicles/{vehicle_id}", headers=h)
    check("DELETE /vehicles/{id} → 204", resp.status_code == 204)

    # Confirm deleted
    resp = requests.get(f"{BASE_URL}/vehicles/{vehicle_id}", headers=h)
    check("GET deleted vehicle → 404", resp.status_code == 404)

    # Re-create for later use
    resp = requests.post(f"{BASE_URL}/vehicles", json={**payload, "name": "Test Vehicle For Tests"}, headers=h)
    return resp.json().get("id", "")


# ──────────────────────────────────────────────
# 2.7 · Arrivals
# ──────────────────────────────────────────────

def test_arrivals(h: dict, vehicle_id: str, driver_id: str) -> str:
    """Returns created arrival id."""
    section("2.7 · Arrivals")

    future_time = (datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%dT%H:%M:%SZ")

    payload = {
        "transport_id": vehicle_id,
        "driver_id": driver_id,
        "time_to_arrival": future_time
    }

    # CREATE
    resp = requests.post(f"{BASE_URL}/arrivals", json=payload, headers=h)
    check("POST /arrivals → 201", resp.status_code in (200, 201), f"{resp.status_code} {resp.text}")
    arrival_id = resp.json().get("id", "")
    check("response has id", bool(arrival_id))
    check("status defaults to pending", resp.json().get("status") == "pending")

    # CREATE – missing transport_id
    bad = {"driver_id": driver_id, "time_to_arrival": future_time}
    resp2 = requests.post(f"{BASE_URL}/arrivals", json=bad, headers=h)
    check("POST /arrivals missing transport_id → 4xx", resp2.status_code in (400, 422))

    # CREATE – missing driver_id
    bad2 = {"transport_id": vehicle_id, "time_to_arrival": future_time}
    resp3 = requests.post(f"{BASE_URL}/arrivals", json=bad2, headers=h)
    check("POST /arrivals missing driver_id → 4xx", resp3.status_code in (400, 422))

    # CREATE – missing time_to_arrival
    bad3 = {"transport_id": vehicle_id, "driver_id": driver_id}
    resp4 = requests.post(f"{BASE_URL}/arrivals", json=bad3, headers=h)
    check("POST /arrivals missing time_to_arrival → 4xx", resp4.status_code in (400, 422))

    # CREATE – invalid transport_id (not a UUID)
    bad4 = {**payload, "transport_id": "not-a-uuid"}
    resp5 = requests.post(f"{BASE_URL}/arrivals", json=bad4, headers=h)
    check("POST /arrivals invalid transport_id → 4xx", resp5.status_code in (400, 422))

    # LIST
    resp = requests.get(f"{BASE_URL}/arrivals", headers=h)
    data = assert_envelope(resp)
    check("GET /arrivals returns list", isinstance(data, list))

    # LIST filter by transport_id
    resp = requests.get(f"{BASE_URL}/arrivals", headers=h, params={"transport_id": vehicle_id})
    check("GET /arrivals ?transport_id → 200", resp.status_code == 200)

    # LIST filter by driver_id
    resp = requests.get(f"{BASE_URL}/arrivals", headers=h, params={"driver_id": driver_id})
    check("GET /arrivals ?driver_id → 200", resp.status_code == 200)

    # LIST filter by status
    resp = requests.get(f"{BASE_URL}/arrivals", headers=h, params={"status": "pending"})
    check("GET /arrivals ?status=pending → 200", resp.status_code == 200)

    # LIST pagination
    resp = requests.get(f"{BASE_URL}/arrivals", headers=h, params={"page": 1, "limit": 5})
    check("GET /arrivals ?page&limit → 200", resp.status_code == 200)

    # GET by id
    resp = requests.get(f"{BASE_URL}/arrivals/{arrival_id}", headers=h)
    check("GET /arrivals/{id} → 200", resp.status_code == 200)
    check("correct id returned", resp.json().get("id") == arrival_id)

    # GET – not found
    resp = requests.get(f"{BASE_URL}/arrivals/00000000-0000-0000-0000-000000000000", headers=h)
    check("GET /arrivals/unknown → 404", resp.status_code == 404)

    # PATCH status → accepted
    resp = requests.patch(f"{BASE_URL}/arrivals/{arrival_id}", json={"status": "accepted"}, headers=h)
    check("PATCH /arrivals/{id} status=accepted → 200", resp.status_code == 200)
    check("status updated to accepted", resp.json().get("status") == "accepted")

    # PATCH status → in_transit
    resp = requests.patch(f"{BASE_URL}/arrivals/{arrival_id}", json={"status": "in_transit"}, headers=h)
    check("PATCH /arrivals/{id} status=in_transit → 200", resp.status_code == 200)

    # PATCH invalid status
    resp = requests.patch(f"{BASE_URL}/arrivals/{arrival_id}", json={"status": "teleporting"}, headers=h)
    check("PATCH /arrivals/{id} invalid status → 4xx", resp.status_code in (400, 422))

    # DELETE
    resp = requests.delete(f"{BASE_URL}/arrivals/{arrival_id}", headers=h)
    check("DELETE /arrivals/{id} → 204", resp.status_code == 204)

    # Confirm deleted
    resp = requests.get(f"{BASE_URL}/arrivals/{arrival_id}", headers=h)
    check("GET deleted arrival → 404", resp.status_code == 404)

    # Re-create for later use
    resp = requests.post(f"{BASE_URL}/arrivals", json=payload, headers=h)
    return resp.json().get("id", "")


# ──────────────────────────────────────────────
# 2.8 · Arrival Requests
# ──────────────────────────────────────────────

def test_arrival_requests(h: dict, arrival_id: str, request_id: str, sku_id: str):
    section("2.8 · Arrival Requests")

    payload = {
        "arrival_id": arrival_id,
        "request_id": request_id,
        "sku_id": sku_id,
        "priority": 1
    }

    # CREATE
    resp = requests.post(f"{BASE_URL}/arrivals-requests", json=payload, headers=h)
    check("POST /arrivals-requests → 201", resp.status_code in (200, 201), f"{resp.status_code} {resp.text}")
    ar_id = resp.json().get("id", "")
    check("response has id", bool(ar_id))

    # CREATE – missing arrival_id
    bad = {k: v for k, v in payload.items() if k != "arrival_id"}
    resp2 = requests.post(f"{BASE_URL}/arrivals-requests", json=bad, headers=h)
    check("POST /arrivals-requests missing arrival_id → 4xx", resp2.status_code in (400, 422))

    # CREATE – missing priority
    bad2 = {k: v for k, v in payload.items() if k != "priority"}
    resp3 = requests.post(f"{BASE_URL}/arrivals-requests", json=bad2, headers=h)
    check("POST /arrivals-requests missing priority → 4xx", resp3.status_code in (400, 422))

    # LIST
    resp = requests.get(f"{BASE_URL}/arrivals-requests", headers=h)
    data = assert_envelope(resp)
    check("GET /arrivals-requests returns list", isinstance(data, list))

    # GET by id
    resp = requests.get(f"{BASE_URL}/arrivals-requests/{ar_id}", headers=h)
    check("GET /arrivals-requests/{id} → 200", resp.status_code == 200)
    check("correct id returned", resp.json().get("id") == ar_id)

    # GET – not found
    resp = requests.get(f"{BASE_URL}/arrivals-requests/00000000-0000-0000-0000-000000000000", headers=h)
    check("GET /arrivals-requests/unknown → 404", resp.status_code == 404)

    # GET recommended
    resp = requests.get(f"{BASE_URL}/arrivals-requests/recomended", headers=h)
    check("GET /arrivals-requests/recomended → 200", resp.status_code == 200)
    check("recomended returns list", isinstance(resp.json(), list))

    # DELETE
    resp = requests.delete(f"{BASE_URL}/arrivals-requests/{ar_id}", headers=h)
    check("DELETE /arrivals-requests/{id} → 204", resp.status_code == 204)


# ──────────────────────────────────────────────
# Unauthorized access
# ──────────────────────────────────────────────

def test_unauthorized():
    section("Unauthorized Access")

    endpoints = [
        "/employees",
        "/clients",
        "/delivery-points",
        "/products",
        "/sku",
        "/requests",
        "/vehicles",
        "/arrivals",
        "/arrivals-requests",
    ]
    for ep in endpoints:
        resp = requests.get(f"{BASE_URL}{ep}")
        check(f"GET {ep} without token → 401/403", resp.status_code in (401, 403))


# ──────────────────────────────────────────────
# Main runner
# ──────────────────────────────────────────────

def main():
    print("\n" + "="*60)
    print("  LOGISTICS SYSTEM API TEST SUITE")
    print("="*60)

    try:
        h = admin_login()
        print(f"\n  Admin login OK — token acquired.")
    except Exception as e:
        print(f"\n  [FATAL] Cannot authenticate: {e}")
        sys.exit(1)

    test_auth()
    test_unauthorized()

    driver_id = test_employees(h)
    client_id = test_clients(h)
    dp_id = test_delivery_points(h, client_id)
    product_id = test_products(h)
    sku_id = test_sku(h, product_id, dp_id)
    request_id = test_requests(h, product_id, dp_id, sku_id)
    vehicle_id = test_vehicles(h)
    arrival_id = test_arrivals(h, vehicle_id, driver_id)
    test_arrival_requests(h, arrival_id, request_id, sku_id)

    passed = _results["passed"]
    failed = _results["failed"]
    total = passed + failed

    print(f"\n{'='*60}")
    print(f"  RESULTS: {passed}/{total} passed", end="")
    if failed:
        print(f"  |  \033[91m{failed} FAILED\033[0m")
    else:
        print(f"  |  \033[92mAll tests passed!\033[0m")
    print("="*60 + "\n")

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()