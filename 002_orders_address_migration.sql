-- Green Moon production order/address compatibility migration
-- Run once against the remote D1 database if desired.
ALTER TABLE orders ADD COLUMN address_line2 TEXT;
