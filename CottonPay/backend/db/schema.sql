-- CottonPay Database Schema
-- Tables for farmers and sales management

-- Farmers table
CREATE TABLE IF NOT EXISTS farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cooperative_id VARCHAR(255) NOT NULL, -- eSignet sub of the cooperative chief
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    email VARCHAR(255),
    esignet_sub VARCHAR(255) NOT NULL UNIQUE, -- eSignet sub of the farmer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    weight_kg DECIMAL(10, 2) NOT NULL,
    price_per_kg DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    payment_reference VARCHAR(255) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'completed',
    payment_method VARCHAR(100) NOT NULL DEFAULT 'Mobile Money',
    collection_point VARCHAR(255),
    credential_exchange_id VARCHAR(255), -- For verifiable credential tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_farmers_cooperative ON farmers(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_farmers_esignet_sub ON farmers(esignet_sub);
CREATE INDEX IF NOT EXISTS idx_sales_farmer ON sales(farmer_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON farmers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
