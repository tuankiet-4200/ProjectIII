-- AlterTable
ALTER TABLE "products" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "meta_description" TEXT,
ADD COLUMN     "meta_title" TEXT;

-- AlterTable
ALTER TABLE "shops" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_banned" BOOLEAN NOT NULL DEFAULT false;
