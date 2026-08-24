-- Safe checkout address migration for existing Green Moon D1 databases.
-- Run once against the remote D1 database if these columns do not already exist.
ALTER TABLE orders ADD COLUMN whatsapp TEXT;
ALTER TABLE orders ADD COLUMN governorate TEXT;
ALTER TABLE orders ADD COLUMN area TEXT;
ALTER TABLE orders ADD COLUMN building TEXT;
ALTER TABLE orders ADD COLUMN floor TEXT;
ALTER TABLE orders ADD COLUMN apartment TEXT;
ALTER TABLE orders ADD COLUMN notes TEXT;
