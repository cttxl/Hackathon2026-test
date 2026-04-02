POST /login
POST /role

POST /employees
GET /employees?page={page}&limit={limit}
GET /employees/{employee_id}
PATCH /employees/{employee_id}
DELETE /employees/{employee_id}



POST /clients
GET /clients?page={page}&limit={limit}
GET /clients/{client_id}
PATCH /clients/{client_id}
DELETE /clients/{client_id}


POST /delivery-points
GET /delivery-points?page={page}&limit={limit}&type={type}&client_id={client_id}
GET /delivery-points/{delivery_point_id}
PATCH /delivery-points/{delivery_point_id}
DELETE /delivery-points/{delivery_point_id}


POST /products
GET /products?page={page}&limit={limit}
GET /products/{product_id}
PATCH /products/{product_id}
DELETE /products/{product_id}


POST /sku
GET /sku?page={page}&limit={limit}&product_id={product_id}&delivery_point_id={delivery_point_id}]
GET /sku/{sku_id}
PATCH /sku/{sku_id}
DELETE /sku/{sku_id}

POST /requests
GET /requests?page={page}&limit={limit}&product_id={product_id}&sku_id={sku_id}&delivery_point_id={delivery_point_id}&status={status}
GET /requests/{request_id}
PATCH /requests/{request_id}
DELETE /requests/{request_id}

POST /arrivals
GET /arrivals?page={page}&limit={limit}&transport_id={transport_id}&driver_id={driver_id}&status={status}
GET /arrivals/{arrival_id}
PATCH /arrivals/{arrival_id}
DELETE /arrivals/{arrival_id}

POST /arrivals-requests
GET /arrivals-requests/recommended?page={page}&limit={limit}&arrival_id={arrival_id}&request_id={request_id}
GET /arrivals-requests?page={page}&limit={limit}&arrival_id={arrival_id}&request_id={request_id}
GET /arrivals-requests/{arrival_request_id}
PATCH /arrivals-requests/{arrival_request_id}
DELETE /arrivals-requests/{arrival_request_id}

/vehicles
GET /vehicles?page={page}&limit={limit}
GET /vehicles/{vehicle_id}
PATCH /vehicles/{vehicle_id}
DELETE /vehicles/{vehicle_id}
