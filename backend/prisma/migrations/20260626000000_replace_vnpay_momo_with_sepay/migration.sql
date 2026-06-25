ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";

CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'SEPAY');

ALTER TABLE "parent_orders"
  ALTER COLUMN "payment_method" TYPE "PaymentMethod"
  USING (
    CASE
      WHEN "payment_method"::text = 'COD' THEN 'COD'
      ELSE 'SEPAY'
    END
  )::"PaymentMethod";

DROP TYPE "PaymentMethod_old";
