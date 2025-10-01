CREATE TABLE gibdd_fines (
    id SERIAL PRIMARY KEY,
    violation_number VARCHAR(50) UNIQUE NOT NULL,
    driver_id INTEGER,
    vehicle_id INTEGER,
    driver_name VARCHAR(255) NOT NULL,
    license_plate VARCHAR(20) NOT NULL,
    violation_type VARCHAR(255) NOT NULL,
    violation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gibdd_fines_status ON gibdd_fines(status);
CREATE INDEX idx_gibdd_fines_violation_date ON gibdd_fines(violation_date);
CREATE INDEX idx_gibdd_fines_driver_id ON gibdd_fines(driver_id);
CREATE INDEX idx_gibdd_fines_vehicle_id ON gibdd_fines(vehicle_id);