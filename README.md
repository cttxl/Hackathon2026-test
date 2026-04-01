POST /login

GET /employees
GET /employees?role={role}
GET /employees/{employee_id}
POST /employees
PATCH /employees/{employee_id}
DELETE /employees/{employee_id}

GET /clients
GET /clients/{client_id}
POST /clients
PATCH /clients/{client_id}
DELETE /clients/{client_id}

GET /client-points
GET /client-points?client_id={client_id}
GET /client-points/{client_point_id}
POST /client-points
PATCH /client-points/{client_point_id}
DELETE /client-points/{client_point_id}

GET /products
GET /products/{product_id}
POST /products
PATCH /products/{product_id}
DELETE /products/{product_id}

GET /products-in-warehouses
GET /products-in-warehouses?warehouse_id={warehouse_id}&product_id={product_id}
GET /products-in-warehouses/{product_in_warehouse_id}
POST /products-in-warehouses
PATCH /products-in-warehouses/{product_in_warehouse_id}
DELETE /products-in-warehouses/{product_in_warehouse_id}

GET /requests
GET /requests?client_point_id={client_point_id}&product_id={product_id}&status={status}
GET /requests/{request_id}
POST /requests
PATCH /requests/{request_id}
DELETE /requests/{request_id}

GET /orders
GET /orders?transport_id={transport_id}&driver_id={driver_id}&status={status}
GET /orders/{order_id}
POST /orders
PATCH /orders/{order_id}
DELETE /orders/{order_id}

GET /order-requests
GET /order-requests?order_id={order_id}&request_id={request_id}
GET /order-requests/{order_request_id}
POST /order-requests
PATCH /order-requests/{order_request_id}
DELETE /order-requests/{order_request_id}

GET /warehouses
GET /warehouses/{warehouse_id}
POST /warehouses
PATCH /warehouses/{warehouse_id}
DELETE /warehouses/{warehouse_id}

GET /transports
GET /transports/{transport_id}
POST /transports
PATCH /transports/{transport_id}
DELETE /transports/{transport_id}