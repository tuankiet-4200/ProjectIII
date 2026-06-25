# SePay Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace VNPay/MoMo checkout options with SePay while keeping COD available.

**Architecture:** The backend remains the source of truth for order creation. For SePay orders, the order processor calculates the final total, creates signed SePay checkout fields, and emits them to the frontend so the browser can submit a POST form to SePay. COD keeps the existing placed-order behavior.

**Tech Stack:** NestJS, Prisma, RabbitMQ event processor, `sepay-pg-node`, Next.js checkout page.

---

### Task 1: Backend SePay Contract

**Files:**
- Modify: `backend/src/orders/orders.processor.spec.ts`
- Modify: `backend/src/orders/orders.processor.ts`
- Create: `backend/src/orders/sepay-checkout.service.ts`

- [ ] Write a failing test that a `SEPAY` order emits `paymentRequired` with `checkoutUrl` and signed fields after order processing.
- [ ] Run `npm test -- orders.processor.spec.ts --runInBand` in `backend` and verify the test fails because SePay metadata is not emitted.
- [ ] Add a small `SepayCheckoutService` wrapping `sepay-pg-node` checkout URL and one-time payment fields.
- [ ] Inject the service into `OrdersProcessor` and emit SePay payment metadata for `SEPAY` orders.
- [ ] Re-run the processor spec and verify it passes.

### Task 2: Payment Enum and Configuration

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260626000000_replace_vnpay_momo_with_sepay/migration.sql`
- Modify: `backend/package.json`
- Modify: `backend/package-lock.json`
- Modify: `.env.example`

- [ ] Change Prisma `PaymentMethod` enum from `COD/VNPAY/MOMO` to `COD/SEPAY`.
- [ ] Add a PostgreSQL enum migration that renames/recreates the enum and maps any old `VNPAY`/`MOMO` values to `SEPAY`.
- [ ] Install `sepay-pg-node` in `backend`.
- [ ] Document `SEPAY_ENV`, `SEPAY_MERCHANT_ID`, `SEPAY_SECRET_KEY`, and frontend return URL env vars.

### Task 3: Frontend Checkout Flow

**Files:**
- Modify: `frontend/types/index.ts`
- Modify: `frontend/services/orders.service.ts`
- Modify: `frontend/app/(public)/checkout/page.tsx`

- [ ] Update frontend `PaymentMethod` type to `COD | SEPAY`.
- [ ] Update checkout service return type to allow async processing and SePay payment metadata.
- [ ] Replace VNPay/MoMo options with SePay in the checkout UI.
- [ ] On checkout response, if SePay metadata exists, create and submit a hidden POST form to SePay.
- [ ] Keep COD showing the local order placed confirmation.

### Task 4: Verification

**Files:**
- No source edits unless verification finds a defect.

- [ ] Run targeted backend tests.
- [ ] Run backend build.
- [ ] Run frontend build or type check.
- [ ] Search for remaining VNPay/MoMo references and remove/update app-owned references.
