-- Add new enum values first (committed separately)
ALTER TYPE "ShopStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "ShopStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
