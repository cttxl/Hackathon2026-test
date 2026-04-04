# Logistics System Backend

An enterprise-ready logistics API built with Go, structured for high maintainability, powered by PostgreSQL, and completely containerized for rapid local testing and deployment.

---

## Deployment Guide

### Prerequisites
- Docker installed
- Docker Compose configured
- Local port 5432 must be free for PostgreSQL

### 1. Configuration
A `.env` file must exist in the root of the project with required configurations. Feel free to copy from the provided example:
```bash
cp .env.example .env
```

### 2. Spinning up the Project
You can effortlessly spin up the database, frontend, and backend simultaneously using Make:
```bash
make up         # Boots all docker containers in detached mode
make migrate-up # Applies DB schemas strictly inside the postgres container
```
That's it!
- Backend API: `http://localhost:8080`
- Frontend UI: `http://localhost:3000`
- Database: `localhost:5432`

---

## Makefile Reference

We utilize `make` to abstract away raw Docker Compose commands efficiently.

| Command | Action |
|---------|--------|
| `make up` | Starts the entire cluster (PostgreSQL, Back-End, Front-End). |
| `make down` | Halts and safely removes all actively running application containers. |
| `make postgres-up` / `down` | Boot or halt purely the PostgreSQL database securely. |
| `make postgres-cleanup` | Dangerously clears volume data (WARNING: removes `./out/pgdata` completely). |
| `make backend-up` / `down` | Manage solely the Go Backend container alongside DB dependencies. |
| `make frontend-up` / `down` | Manage solely the React Frontend app. |
| `make migrate-create name=...` | Generate a scaffold for a new SQL migration payload under `/migrations`. |
| `make migrate-up` / `down` | Migrate the backend PostgreSQL schema forwards or roll revisions backwards. |
| `make test` | Boots an ephemeral Python container running the end-to-end integration test suite. |
| `make fakedata` | Boots a python script randomly populating the database with mock test properties. |

---

## API Documentation

The backend adheres strictly to modern RESTful principles, providing explicit envelopes for array lists and graceful JSON error feedback.

### 1. Global Behaviors

#### Standard Resource Envelope
Endpoints returning standard solitary queries natively yield a direct JSON object. Endpoints dealing with *Lists* uniformly enforce the following structured envelope:

```json
{
  "data": [
    { "id": "123e4567-e89b-12d3...", "name": "..." }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

#### Error Handling and Status Codes
Any structural or validation error returns a standardized schema. Constraint violations emit appropriate HTTP Codes:
- `400 Bad Request`: Missing constraints or invalid ENUM values.
- `401 Unauthorized` / `403 Forbidden`: Unauthenticated access.
- `404 Not Found`: Unknown Resource UUID queries.
- `409 Conflict`: PostgreSQL deduplication conflicts (e.g. duplicate distinct emails).
- `500 Server Error`: Unhandled Database panic.

```json
{
  "error": "Detailed reason why the request failed"
}
```

#### REST Constraints
Lists queries intrinsically listen for `page` and `limit` arguments.
Standard REST routes are uniformly followed for all core resources:
- `POST /{resource}`: Create a new resource.
- `GET /{resource}`: List resources with pagination/filtering schemas.
- `GET /{resource}/{id}`: Read solitary resource attributes.
- `PATCH /{resource}/{id}`: Partial update to attributes (fields omitted are ignored).
- `DELETE /{resource}/{id}`: Delete the resource persistently.

---

### 2. Available Resources

#### Employees (`/employees`)
Administrators and staff utilizing the logistic dashboards.

**Resource Fields:**
- `email` (string): Must uniquely identify the user (`*@*.*`). Conflicts throw 409 status.
- `fullname` (string): Length max 100.
- `role` (string): Enum restricted to `driver`, `logistician`, `warehouse_manager`, `admin`.
- `password` (string): Required exclusively on POST.
- `phone` (string): Standard dial string (e.g. `+123456789`).

#### Clients (`/clients`)
Companies placing outbound logistics requests tied to custom warehouse spaces.

**Resource Fields:**
- `email` (string): Must uniquely identify the client (`*@*.*`). Conflicts throw 409 status.
- `name` (string): Internal corporate name.
- `password` (string): Required exclusively on POST.
- `phone` (string): Standard dial string.

#### Delivery Points (`/delivery-points`)
Discrete physical origins tightly mapped to client boundaries.

**Resource Fields:**
- `name` (string): Location identifier.
- `address` (string): Strict local address string.
- `owner_id` (UUID): Reference to the assigned Client node `Client.id`.
- `type` (string): Enum restricted to `warehouse`, `client_point`, `provider`.
- `height`, `width`, `length` (integer): Dimensional bounds representing capacities (optional).

**Search Filters (GET):**
- `?type={enum}`
- `?owner_id={uuid}`

#### Products (`/products`)
Abstract material stock types universally tracked across dispatches.

**Resource Fields:**
- `name` (string): Identity identifier.
- `weight`, `height`, `width`, `length` (int): Required bounds, strictly evaluated > 0.

#### SKU (`/sku`)
Real-time bindings linking a discrete Product explicitly to a specific Delivery Point warehouse node.

**Resource Fields:**
- `product_id` (UUID): Associates sequentially to `Product.id`.
- `delivery_point_id` (UUID): Associates sequentially to `DeliveryPoint.id`.

**Search Filters (GET):**
- `?product_id={uuid}`
- `?delivery_point_id={uuid}`

#### Requests (`/requests`)
Granular actionable demand order parameters tracked locally to a single client footprint. Note: Clients explicitly are forbidden from partial update (PATCH) actions.

**Resource Fields:**
- `product_id` (UUID): Explicit link to request material stock.
- `delivery_point_id` (UUID): Node destined to act as the receiving unit.
- `quantity` (int): Capacity required strictly evaluated > 0.
- `emergency` (string): Enum accepting `default`, `high`, `critical`. Defaults to `default`.
- `status` (string): Tracked globally. Expected constraints: `pending`, `accepted`, `in_transit`, `delivered`, `cancelled`. Defaults to `pending` upon POST invocation.

**Search Filters (GET):**
- `?product_id={uuid}`
- `?delivery_point_id={uuid}`
- `?status={enum}`
- `?sku_id={uuid}` (Array inspection bindings via the association table constraints)

#### Arrivals (`/arrivals`)
Logistics dispatches associating specific drivers with hardware transport currently spanning transit gaps.

**Resource Fields:**
- `transport_id` (UUID): Identifier for hardware Fleet unit `Vehicle.id`.
- `driver_id` (UUID): Employee designated actively executing task `Employee.id`.
- `time_to_arrival` (DATE): Timestamp utilizing strictly ISO 8601 formatting required globally.
- `status` (string): Matches equivalent Request constraints (`pending`...`cancelled`).

**Search Filters (GET):**
- `?transport_id={uuid}`
- `?driver_id={uuid}`
- `?status={enum}`

#### Arrival Requests (`/arrivals-requests`)
Bridge tables indexing active parent transit Trips simultaneously across granular multi-Sku demand Requests.

**Resource Fields:**
- `arrival_id` (UUID): Dispath reference.
- `request_id` (UUID): Core material Demand reference.
- `sku_ids` (array of UUID strings): Indexed target UUID pointers loaded into dispatches.
- `priority` (int): Integer index representation determining hierarchy execution priority strictly > 0.

**Active Algorithms (GET):**
- `GET /arrivals-requests/recomended` — Evaluates existing metrics invoking deterministic sorting logic rendering standard array envelopes containing the idealized bounds natively over JSON representation.

#### Vehicles (`/vehicles`)
Fleet capabilities available throughout logistics network topologies.

**Resource Fields:**
- `name` (string): Name identifiers.
- `address` (string): Rest location.
- `fuel_type` (string): Enum constraints limited strictly to `diesel`, `gasoline`, `electric`.
- `fuel_consumption` (int): General boundary efficiency constraint mappings > 0.
- `max_weight`, `max_height`, `max_width`, `max_length` (int): Limit properties matching exact item storage rules > 0.
