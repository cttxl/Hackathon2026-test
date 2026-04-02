# API Documentation for Logistics System


## 1. System-Wide Standards

### 1.1. Pagination
For endpoints returning lists (e.g., `GET /employees`), the system uses cursor or offset pagination.
- `page` (integer): The current page number (default: `1`).
- `limit` (integer): The number of items to return per page (default: `10`).

### 1.2. Standard Response Wrappers
**Success List Response:**
```json
{
  "data": [
    // ... list of items
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

**Standard Error Response:**
```json
{
  "error": "A clear, actionable error message (e.g., 'Invalid email format')"
}
```

---

## 2. Authentication

### `POST /login`
Authenticates a user (Employee or Client) and returns a JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "type": "employee", 
    "role": "logistician"
  }
}
```

---

## 3. Resources

For each resource, standard CRUD operations are available. Unless specified otherwise, these behaviors apply:
- **`GET /{resource}`**: Returns a paginated list of resources.
- **`GET /{resource}/{id}`**: Returns a single resource by ID.
- **`PATCH /{resource}/{id}`**: Updates fields. Only included fields are modified.
- **`DELETE /{resource}/{id}`**: Deletes the resource (Returns `204 No Content`).

### 3.1. Employees
*(Roles: `driver`, `logistician`, `warehouse_manager`)*

**`POST /employees`**
```json
{
  "fullname": "John Doe",
  "email": "john.doe@example.com",
  "password": "strong_password123",
  "phone": "+1234567890",
  "role": "driver"
}
```
*Note: The password field is omitted from all employee responses.*

### 3.2. Clients

**`POST /clients`**
```json
{
  "name": "Acme Corp",
  "password": "strong_password123",
  "email": "contact@acme.com",
  "phone": "+1234567891"
}
```
*Note: The password field is omitted from all client responses.*

### 3.3. Delivery Points
*(Types: `warehouse`, `client_point`, `provider`)*

**`POST /delivery-points`**
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
*Query Filters (`GET`):* `type`, `owner_id`

### 3.4. Products

**`POST /products`**
```json
{
  "name": "Steel Pipes 5m",
  "weight": 200,
  "height": 50,
  "width": 50,
  "length": 500
}
```

### 3.5. SKU (Stock Keeping Units)
Maps a specific product to a specific delivery point.

**`POST /sku`**
```json
{
  "product_id": "123e4567-e89b-12d3-a456-426614174004",
  "delivery_point_id": "123e4567-e89b-12d3-a456-426614174003"
}
```
*Query Filters (`GET`):* `product_id`, `delivery_point_id`

### 3.6. Requests (Orders)
*(Status: `pending`, `accepted`, `shipped`, `delivered`, `cancelled`)*

**`POST /requests`**  
*(Note: Initial status defaults to `pending`)*
```json
{
  "product_id": "123e4567-e89b-12d3-a456-426614174004",
  "quantity": 50,
  "delivery_point_id": "123e4567-e89b-12d3-a456-426614174003",
  "emergency": false
}
```
*Query Filters (`GET`):* `product_id`, `delivery_point_id`, `sku_id`, `status`

### 3.7. Arrivals

**`POST /arrivals`**  
*(Note: Initial status defaults to `pending`)*
```json
{
  "transport_id": "123e4567-e89b-12d3-a456-426614174100", 
  "driver_id": "123e4567-e89b-12d3-a456-426614174001",
  "time_to_arrival": "2026-04-05T10:00:00Z"
}
```
*Query Filters (`GET`):* `transport_id`, `driver_id`, `status`

### 3.8. Arrivals Schedule

**`POST /arrivals-schedule`**
```json
{
  "arrival_id": "123e4567-e89b-12d3-a456-426614174007"
}
```

### 3.9. Arrival Requests (Mappings/Dispatch)

**`POST /arrivals-requests`**
```json
{
  "arrival_id": "123e4567-e89b-12d3-a456-426614174007",
  "request_id": "123e4567-e89b-12d3-a456-426614174006",
  "sku_id": "123e4567-e89b-12d3-a456-426614174005",
  "priority": 1
}
```

### 3.10. Vehicles
*(Fuel types: `diesel`, `gasoline`, `electric`)*

**`POST /vehicles`**
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
