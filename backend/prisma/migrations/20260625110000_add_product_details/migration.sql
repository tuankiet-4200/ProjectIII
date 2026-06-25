ALTER TABLE "products"
ADD COLUMN "features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "specifications" JSONB;
