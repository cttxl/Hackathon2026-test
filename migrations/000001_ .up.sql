CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fullname VARCHAR(100) NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    email VARCHAR(100) NOT NULL UNIQUE CHECK (email LIKE '%@%.%'),
    phone VARCHAR(20) NOT NULL CHECK (phone ~ '^\+[0-9]+$'),

    role VARCHAR(50) NOT NULL CHECK (role IN ('driver', 'logistician', 'warehouse_manager', 'admin')),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    email VARCHAR(100) NOT NULL UNIQUE CHECK (email LIKE '%@%.%'),
    phone VARCHAR(20) NOT NULL CHECK (phone ~ '^\+[0-9]+$'),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

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

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE delivery_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,

    owner_id UUID NOT NULL,

    type VARCHAR(50) NOT NULL CHECK (type IN ('warehouse', 'client_point', 'provider')),

    height INT,
    width INT,
    length INT,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (owner_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,

    weight INT NOT NULL,
    height INT NOT NULL,
    width INT NOT NULL,
    length INT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sku (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,

    delivery_point_id UUID NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (delivery_point_id) REFERENCES delivery_points(id) ON DELETE CASCADE
);

CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL,
    quantity INT NOT NULL,

    delivery_point_id UUID NOT NULL,
    emergency VARCHAR(50) NOT NULL DEFAULT 'default' CHECK (emergency IN ('default', 'high', 'critical')),

    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_transit', 'delivered', 'cancelled')),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (delivery_point_id) REFERENCES delivery_points(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);


CREATE TABLE arrivals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    transport_id UUID NOT NULL,
    driver_id UUID NOT NULL,

    time_to_arrival TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_transit', 'delivered', 'cancelled')), --TODO: CHANGE

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (transport_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES employees(id) ON DELETE CASCADE
);



CREATE TABLE arrivals_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    arrival_id UUID NOT NULL,
    request_id UUID NOT NULL,

    sku_ids UUID[] NOT NULL,

    priority INT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP ,

    FOREIGN KEY (arrival_id) REFERENCES arrivals(id) ON DELETE CASCADE,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
);

-- Емуляція FOREIGN KEY для масиву sku_ids з перевіркою існування
CREATE OR REPLACE FUNCTION check_sku_ids_exist()
RETURNS TRIGGER AS $$
DECLARE
    missing_count INT;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM unnest(NEW.sku_ids) AS s(id)
    WHERE NOT EXISTS (SELECT 1 FROM sku WHERE id = s.id);

    IF missing_count > 0 THEN
        RAISE EXCEPTION 'FOREIGN KEY VIOLATION: One or more sku_ids do not exist in sku table';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_sku_ids
BEFORE INSERT OR UPDATE ON arrivals_requests
FOR EACH ROW
EXECUTE FUNCTION check_sku_ids_exist();

-- Емуляція ON DELETE CASCADE для масиву sku_ids
CREATE OR REPLACE FUNCTION cascade_delete_sku()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM arrivals_requests WHERE OLD.id = ANY(sku_ids);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cascade_delete_sku
AFTER DELETE ON sku
FOR EACH ROW
EXECUTE FUNCTION cascade_delete_sku();



INSERT INTO employees (fullname, password_hash, email, phone, role) 
VALUES ('Default Admin', '$2a$10$kItRUdzWLlfcVX2EeZf4ruPKoknMGx2s2k9lGdHrkcgb5F29jblc2', 'admin@admin.com', '+0000000000', 'admin');
