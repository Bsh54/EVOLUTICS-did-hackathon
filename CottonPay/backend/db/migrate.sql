-- Migration script to add missing columns to sales table
-- Run this if the sales table already exists without these columns

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100) DEFAULT 'Mobile Money',
ADD COLUMN IF NOT EXISTS collection_point VARCHAR(255);

-- Update existing rows with default values if needed
UPDATE sales
SET
    transaction_id = COALESCE(transaction_id, 'TXN-' || id),
    payment_reference = COALESCE(payment_reference, 'MOMO-' || id),
    payment_status = COALESCE(payment_status, 'completed'),
    payment_method = COALESCE(payment_method, 'Mobile Money')
WHERE transaction_id IS NULL OR payment_reference IS NULL;

-- Make transaction_id and payment_reference NOT NULL after populating
ALTER TABLE sales
ALTER COLUMN transaction_id SET NOT NULL,
ALTER COLUMN payment_reference SET NOT NULL;
