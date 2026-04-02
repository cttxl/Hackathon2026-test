

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,

    fuel_type VARCHAR(50) NOT NULL CHECK (fuel_type IN ('diesel', 'gasoline', 'electric')),
    fuel_consumption INT NOT NULL,

    max_weight INT NOT NULL,
    max_height INT NOT NULL,
    max_width INT NOT NULL,
    max_length INT NOT NULL,

    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
);


CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,

    weight INT NOT NULL,
    height INT NOT NULL,
    width INT NOT NULL,
    length INT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
);

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,

    email VARCHAR(100) NOT NULL UNIQUE CHECK (email LIKE '%@%.%'),
    phone VARCHAR(20) NOT NULL CHECK (phone ~ '^\+[0-9]+$'),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
);

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fullname VARCHAR(100) NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    email VARCHAR(100) NOT NULL UNIQUE CHECK (email LIKE '%@%.%'),
    phone VARCHAR(20) NOT NULL CHECK (phone ~ '^\+[0-9]+$'),

    role VARCHAR(50) NOT NULL CHECK (role IN ('driver', 'logistician', 'warehouse_manager')),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
);



CREATE TABLE delivery_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,

    client_id UUID NOT NULL,

    type VARCHAR(50) NOT NULL CHECK (type IN ('warehouse', 'client_point', 'provider')),

    height INT,
    width INT,
    length INT,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
);


CREATE TABLE sku (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,

    delivery_point UUID NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (delivery_point) REFERENCES delivery_points(id) ON DELETE CASCADE
);

CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL,
    quantity INT NOT NULL,

    delivery_point UUID NOT NULL,
    emergency BOOLEAN NOT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'shipped', 'delivered', 'cancelled')),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (delivery_point) REFERENCES delivery_points(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
);


CREATE TABLE arrivals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    transport UUID NOT NULL,
    driver UUID NOT NULL,

    time_to_arrival TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'shipped', 'delivered', 'cancelled')),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (transport) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (driver) REFERENCES employees(id) ON DELETE CASCADE,
);

CREATE TABLE arrivals_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    arrival UUID NOT NULL,
    request UUID NOT NULL,

    sku UUID[] NOT NULL,

    priority INT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (arrival) REFERENCES arrivals(id) ON DELETE CASCADE,
    FOREIGN KEY (request) REFERENCES requests(id) ON DELETE CASCADE
    FOREIGN KEY (sku) REFERENCES sku(id) ON DELETE CASCADE
);
