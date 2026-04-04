# LOCAL HOSTING GUIDE

## Requirements
- Docker
- Docker Compose
- Make

## Configuration
Ensure your `.env` file is present in the project root with the necessary database configurations

## Running the Application
To run the entire system (Database, Backend, and Frontend), simply run:

```bash
make up
make migrate-up
```

This will:
- Start the PostgreSQL database on port `5432`
- Build and start the Go Backend on port `8080` (API: `http://localhost:8080`)
- Build and start the React Frontend on port `3000` (UI: `http://localhost:3000`)

## Useful Commands

- `make up`: Starts the application.
- `make down`: Stops and removes all containers.
- `make migrate-up`: Runs database migrations.
- `make migrate-down`: Reverts database migrations.
- `make backend-up`: Starts only the go backend (and postgres dependency).
- `make frontend-up`: Starts only the react frontend (and backend dependency).
- `make postgres-cleanup`: Prompts to safely delete the database data.

# API Documentation for Logistics System

This is the comprehensive whole system API documentation. It details every parameter, default behavior, constraints, and standard structure for interacting with the backend.

## 1. System-Wide Behaviors

### 1.1 Standard Response Envelopes
All successful queries returning *a single resource* return the JSON resource natively.
All endpoints returning *a list of resources* (e.g., `GET /employees`) utilize the following envelope:
```json
{
  "data": [
    { "id": "uuid", "..." : "..." }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

**Standard Error Response:**
Failures return a standard `error` key with descriptive string, adhering to applicable HTTP status codes (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`).
```json
{
  "error": "A clear, actionable error message"
}
```

### 1.2 Pagination
List endpoints accept standard pagination queries:
- `page` (integer): Current page number (default: `1`).
- `limit` (integer): Number of items per page (default: `10`).

### 1.3 RESTful Consistency
All standard CRUD resources adopt matching paths:
- **`POST /{resource}`**: Creates a resource. Expects a JSON body matching `{Resource}Create` constraints. Returns `201 Created`.
- **`GET /{resource}`**: Retrieves a paginated list of resources. Supports `page`, `limit`, and resource-specific query filters. Returns `200 OK`.
- **`GET /{resource}/{id}`**: Retrieves a single resource by UUID. Returns `200 OK`.
- **`PATCH /{resource}/{id}`**: Edits a resource by UUID. Fields are optional. Only passed fields will be modified. Returns `200 OK`.
- **`DELETE /{resource}/{id}`**: Deletes a resource by UUID. Returns `204 No Content`.

---

## 2. Resources

### 2.1 Employees (`/employees`)
Employees represent staff utilizing the system.

**Constraints:**
- `fullname`: string (max 100), required.
- `email`: string (max 100), required, unique, must match `%@%.%`.
- `password`: string, required upon creation.
- `phone`: string (max 20), required, must match regex `^\+[0-9]+$`.
- `role`: string, required, Enum: `driver`, `logistician`, `warehouse_manager`, `admin`.

**Create Request (`POST`) Example:**
*(Requires Admin Authentication Token)*
```json
{
  "fullname": "John Doe",
  "email": "john.doe@example.com",
  "password": "secure_password",
  "phone": "+1234567890",
  "role": "driver"
}
```

---

### 2.2 Clients (`/clients`)
Clients who utilize the logistics systems to execute supply orders and host delivery points.

**Constraints:**
- `name`: string (max 100), required.
- `email`: string (max 100), required, unique, must match `%@%.%`.
- `password`: string, required upon creation.
- `phone`: string (max 20), required, must match regex `^\+[0-9]+$`.

**Create Request (`POST`) Example:**
*(Requires Admin Authentication Token)*
```json
{
  "name": "Acme Corp",
  "password": "secure_password",
  "email": "contact@acme.com",
  "phone": "+1234567891"
}
```

---

### 2.3 Delivery Points (`/delivery-points`)
Physical locations mapped to Clients where pickups or deliveries occur.

**Constraints:**
- `name`: string (max 100), required.
- `address`: string (max 255), required.
- `owner_id`: UUID, required, foreign key referencing a `client.id`.
- `type`: string, required, Enum: `warehouse`, `client_point`, `provider`.
- `height`: integer, optional.
- `width`: integer, optional.
- `length`: integer, optional.

**Query Filters (`GET`):**
- `?type={enum}`
- `?owner_id={uuid}`

**Create Request (`POST`) Example:**
```json
{
  "name": "Central Warehouse A",
  "address": "123 Industry Ave, Cityville",
  "owner_id": "123e4567-e89b-12d3-a456-426614174002",
  "type": "warehouse",
  "height": 500,
  "width": 1000,
  "length": 2000
}
```

---

### 2.4 Products (`/products`)
Abstract stock types tracked within the logistics system globally.

**Constraints:**
- `name`: string (max 100), required.
- `weight`: integer, required.
- `height`: integer, required.
- `width`: integer, required.
- `length`: integer, required.

**Create Request (`POST`) Example:**
```json
{
  "name": "Steel Pipes 5m",
  "weight": 200,
  "height": 50,
  "width": 50,
  "length": 500
}
```

---

### 2.5 SKU (Stock Keeping Units) (`/sku`)
The linkage binding an abstract Product to a specific Delivery Point entity location.

**Constraints:**
- `product_id`: UUID, required, foreign key referencing `product.id`.
- `delivery_point_id`: UUID, required, foreign key referencing `delivery_point.id`.

**Query Filters (`GET`):**
- `?product_id={uuid}`
- `?delivery_point_id={uuid}`

**Create Request (`POST`) Example:**
```json
{
  "product_id": "123e4567-e89b-12d3-a456-426614174004",
  "delivery_point_id": "123e4567-e89b-12d3-a456-426614174003"
}
```

---

### 2.6 Requests (Orders) (`/requests`)
The actionable demand requests representing units needed at a Delivery Point location.

**Constraints:**
- `product_id`: UUID, required, foreign key referencing `product.id`.
- `quantity`: integer, required.
- `delivery_point_id`: UUID, required, foreign key referencing `delivery_point.id`.
- `emergency`: string. Optional (defaults to `default`). Enum: `default`, `high`, `critical`.
- `status`: string. Read-only on creation (defaults to `pending`). Enum: `pending`, `accepted`, `in_transit`, `delivered`, `cancelled`. Can be modified via `PATCH`.

**Query Filters (`GET`):**
- `?product_id={uuid}`
- `?delivery_point_id={uuid}`
- `?status={enum}`
- `?sku_id={uuid}` (Filters for Requests tied to an Arrival Request connected specifically to a SKU).

**Create Request (`POST`) Example:**
```json
{
  "product_id": "123e4567-e89b-12d3-a456-426614174004",
  "quantity": 50,
  "delivery_point_id": "123e4567-e89b-12d3-a456-426614174003",
  "emergency": "default"
}
```
*(Note: System determines ownership implicitly if user role is Client. Clients cannot update requests directly via `PATCH`.)*

---

### 2.7 Arrivals (`/arrivals`)
Logistics dispatches associating drivers with specific transport vehicles on a journey.

**Constraints:**
- `transport_id`: UUID, required, foreign key referencing `vehicle.id`.
- `driver_id`: UUID, required, foreign key referencing `employee.id` (Driver).
- `time_to_arrival`: TIMESTAMPTZ, required, standard ISO date string format.
- `status`: string. Read-only on creation (defaults to `pending`). Enum: `pending`, `accepted`, `in_transit`, `delivered`, `cancelled`. Can be modified via `PATCH`.

**Query Filters (`GET`):**
- `?transport_id={uuid}`
- `?driver_id={uuid}`
- `?status={enum}`

**Create Request (`POST`) Example:**
```json
{
  "transport_id": "123e4567-e89b-12d3-a456-426614174100", 
  "driver_id": "123e4567-e89b-12d3-a456-426614174001",
  "time_to_arrival": "2026-04-05T10:00:00Z"
}
```

---

### 2.8 Arrival Requests (`/arrivals-requests`)
Maps specific Arrivals (deliveries/trips) to granular demand Requests, acting as the manifest line items identifying priority of transport for specific stocks.

**Constraints:**
- `arrival_id`: UUID, required, foreign key referencing `arrival.id`.
- `request_id`: UUID, required, foreign key referencing `request.id`.
- `sku_id`: UUID, required, foreign key referencing `sku.id`.
- `priority`: integer, required.

*(Note: Standard `/arrivals-requests` GET queries do not possess pre-packaged filter columns).*

**`GET /arrivals-requests/recomended`**
Executes recommendation algorithm to return an optimal list of arrival-requests.
(Currently returns an empty list while the algorithm is pending implementation).

**Create Request (`POST`) Example:**
```json
{
  "arrival_id": "123e4567-e89b-12d3-a456-426614174007",
  "request_id": "123e4567-e89b-12d3-a456-426614174006",
  "sku_id": "123e4567-e89b-12d3-a456-426614174005",
  "priority": 1
}
```

---

### 2.9 Vehicles (`/vehicles`)
Available transportation capabilities within the logistics network fleet.

**Constraints:**
- `name`: string (max 100), required.
- `fuel_type`: string, required. Enum: `diesel`, `gasoline`, `electric`.
- `fuel_consumption`: integer, required.
- `max_weight`: integer, required.
- `max_height`: integer, required.
- `max_width`: integer, required.
- `max_length`: integer, required.
- `address`: string, required.

**Create Request (`POST`) Example:**
```json
{
  "name": "Volvo Truck XL",
  "fuel_type": "diesel",
  "fuel_consumption": 25,
  "max_weight": 20000,
  "max_height": 400,
  "max_width": 250,
  "max_length": 1200,
  "address": "Depot 1, Route 66"
}
```
