# Perfect Rent & Remind – Test Scenarios Specification
**Course:** Advanced Web Technologies (AWT) – Practical 9  
**Application:** Perfect Rent & Remind – Smart Clothing Rental Management System  
**System Architecture:** Node.js (Express 5), MongoDB (Mongoose 8), React 19 Frontend  

---

## Executive Summary
This document defines the formal test scenarios for the **Perfect Rent & Remind** smart clothing rental management system. Scenarios are derived directly from the authoritative system specifications (`BUSINESS_RULES.md`, `API_ENDPOINTS.md`, `CONTRACTS.md`, `DATABASE_DESIGN.md`) and the underlying backend implementation in `backend/src/`.

Each test scenario encapsulates an operational requirement or business capability, providing the foundation for positive, negative, and boundary test case generation.

---

## Master Test Scenario Matrix

| Scenario ID | Primary Module / Route | Scenario Title | Test Objective & Scope | Applicable Business Rules |
|:---:|:---|:---|:---|:---:|
| **TS-01** | Authentication (`/api/auth`) | Customer Registration, Authentication, and Token Issuance | Verify new user onboarding, password hashing via bcryptjs, customer role enforcement (preventing privilege escalation), credential authentication, and JWT Bearer token generation. | BR-001, BR-002, BR-003, BR-021 |
| **TS-02** | Middleware & Security (`auth.middleware.js`) | Role-Based Access Control and Privilege Enforcement | Validate token-based route protection, automatic rejection of missing/malformed/expired tokens, and role-based access restrictions (`CUSTOMER` vs. `ADMIN`) across all API tiers. | BR-001, BR-020, BR-021 |
| **TS-03** | Clothing Catalogue (`/api/clothing`) | Clothing Catalogue Browsing, Filtering, and Pagination | Ensure public inventory discovery with multi-parameter query filtering (category, size, color, price range, availability), pagination metadata, and verify that unsupported date filters return HTTP 501. | BR-004, BR-010, BR-034, BR-040 |
| **TS-04** | Booking Engine (`/api/bookings`, `booking.service.js`) | Inventory Reservation, Rental Date Boundary Validation, and Overlap Prevention | Validate booking creation with future UTC dates, rejection of past dates, rejection of invalid date orders (`startDate >= returnDate`), total quantity checks, and atomic concurrency control preventing overbooking (HTTP 409). | BR-005, BR-006, BR-011, BR-012, BR-030, BR-041, BR-042 |
| **TS-05** | Pricing Engine (`calculateRental.js`, `Booking.js`) | Rental Pricing, Security Deposit, and Financial Computation | Verify mathematical computation of rental duration in UTC whole days, linear rental charge calculation (`rentalPrice * quantity * duration`), flat security deposit addition, and immutable total calculation. | BR-006, BR-007, BR-008, BR-009, BR-042 |
| **TS-06** | Booking Lifecycle (`/api/bookings`, `cancelBooking`) | Customer Booking History Isolation and Cancellation Workflow | Confirm that customers can view only their own bookings, verify voluntary cancellation from `PENDING` or `CONFIRMED` states, automatic reservation release, and rejection of cancellation on completed/returned rentals. | BR-013, BR-014, BR-031, BR-036 |
| **TS-07** | Payments Engine (`/api/payments`, `payment.service.js`) | Electronic Payment Processing (UPI/CARD) and Atomic Confirmation | Verify simulated electronic payment initiation, generation of `PAID` payment records with transaction timestamps, and atomic status transition of bookings from `PENDING` to `CONFIRMED` within a MongoDB session. | BR-016, BR-037, BR-038, BR-043, BR-044 |
| **TS-08** | Cash on Pickup (`/api/payments`, `booking.controller.js`) | Cash-on-Pickup Payment Initiation and Physical Handover Collection | Validate that choosing `CASH_ON_PICKUP` records a `PENDING` payment with `paidAt: null` without confirming the booking, allow manual admin confirmation, and collect payment atomically upon handover to `PICKED_UP`. | BR-026, BR-036, BR-037, BR-044 |
| **TS-09** | Concurrency & Data Integrity (`Payment.js`, `transactionHelper.js`) | Duplicate Payment Prevention and Transaction Rollback Integrity | Verify single-payment enforcement per booking via `payments.bookingId` unique index, safe handling of concurrent payment race conditions, and automatic rollback of payment records upon downstream booking failure. | BR-015, BR-037, BR-041, BR-043 |
| **TS-10** | Refund Administration (`/api/payments/:id/refund`) | Administrative Booking Refund Processing and Eligibility Enforcement | Validate admin-only refund execution for `PAID` payments on `CANCELLED` bookings, status transition to `REFUNDED`, rejection of refunds on uncollected cash payments, and prevention of duplicate refunds. | BR-017, BR-031, BR-037 |
| **TS-11** | Physical Returns (`/api/returns`, `return.controller.js`) | Return Logging, Calendar-Day Late Fine Computation, and Data Masking | Verify admin return intake, calendar-day difference calculation for overdue items (₹100/day fine), condition recording (`RETURNED`, `LATE`, `DAMAGED`), booking transition to `RETURNED`, and customer masking of unsettled deposit fields. | BR-018, BR-019, BR-032, BR-036, BR-042 |
| **TS-12** | Deposit Settlement (`/api/returns/:id/settle`) | Security Deposit Settlement, Damage Deductions, and Finalization | Validate admin return settlement, damage charge deduction from security deposit, deposit refund computation, marking `settled = true`, atomic booking transition to `COMPLETED`, and HTTP 409 idempotency on repeat calls. | BR-032, BR-033, BR-036, BR-045 |

---

## Detailed Scenario Descriptions

### TS-01: Customer Registration, Authentication, and Token Issuance
- **Objective:** Verify that new customers can register with name, email, password, and phone number; confirm that passwords are encrypted using `bcryptjs` and never exposed in responses; ensure that payload role tampering (e.g., passing `"role": "ADMIN"`) is strictly ignored and forced to `"CUSTOMER"`; and verify authentication via email/password resulting in a valid signed JWT Bearer token.
- **Components:** `src/controllers/auth.controller.js`, `src/validators/auth.validator.js`, `src/models/User.js`, `src/utils/generateToken.js`.
- **Preconditions:** MongoDB connection active, User collection accessible.

### TS-02: Role-Based Access Control and Privilege Enforcement
- **Objective:** Evaluate system security boundaries across public, customer-protected, and admin-protected endpoints. Ensure that missing tokens return HTTP 401 (`AUTH_TOKEN_MISSING`), invalid or expired tokens return HTTP 401 (`AUTH_TOKEN_INVALID`), and regular customers attempting admin operations (e.g., category creation, status updates, returns, settlements, refunds) receive HTTP 403 (`FORBIDDEN`).
- **Components:** `src/middleware/auth.middleware.js` (`protect`, `admin`).
- **Preconditions:** Registered customer account, registered admin account.

### TS-03: Clothing Catalogue Browsing, Filtering, and Pagination
- **Objective:** Validate public inventory retrieval with multi-criteria filtering including category ID/name, garment size, color regex, price range (`minPrice`, `maxPrice`), and availability flag. Verify pagination metadata (`page`, `limit`, `totalItems`, `totalPages`). Validate that attempts to filter by `startDate` and `endDate` gracefully return HTTP 501 `NOT_IMPLEMENTED` as documented in Phase 1 constraints.
- **Components:** `src/controllers/clothing.controller.js`, `src/models/Clothing.js`, `src/models/Category.js`.
- **Preconditions:** Seeded categories and clothing items with varying sizes, prices, and stock.

### TS-04: Inventory Reservation, Rental Date Boundary Validation, and Overlap Prevention
- **Objective:** Test the core booking creation engine. Ensure that rental start date must precede return date, rental duration must be at least 1 full day, start date cannot be in the past relative to the current UTC date, and requested quantity cannot exceed total physical stock. Under concurrent booking requests, verify that active bookings (`PENDING`, `CONFIRMED`, `PICKED_UP`, `OVERDUE`) correctly reserve inventory such that overlapping requests exceeding available stock are rejected with HTTP 409 (`BOOKING_OVERLAP`).
- **Components:** `src/services/booking.service.js`, `src/controllers/booking.controller.js`, `src/models/Booking.js`.
- **Preconditions:** Available clothing item with known quantity.

### TS-05: Rental Pricing Calculation, Security Deposit, and Financial Computation
- **Objective:** Verify financial integrity of booking calculations. Confirm that rental duration is calculated in whole UTC days using `(returnDate - startDate) / 86400000 ms`, rental amount strictly equals `rentalPrice * quantity * rentalDuration`, security deposit is added as a flat fee (independent of quantity or duration), and `totalAmount = rentalAmount + securityDeposit`.
- **Components:** `src/utils/calculateRental.js`, `src/models/Booking.js`, `src/services/booking.service.js`.
- **Preconditions:** Active clothing catalog record with defined `rentalPrice` and `securityDeposit`.

### TS-06: Customer Booking History Isolation and Cancellation Workflow
- **Objective:** Ensure customer data confidentiality by verifying that `GET /api/bookings` returns only the caller's own bookings. Verify voluntary customer cancellation via `PUT /api/bookings/:id/cancel` for bookings in `PENDING` or `CONFIRMED` states, confirming that cancellation immediately releases reserved inventory. Ensure that cancellations cannot be executed on `RETURNED` or `COMPLETED` bookings (HTTP 400 `BOOKING_NOT_CANCELLABLE`).
- **Components:** `src/controllers/booking.controller.js`, `src/services/booking.service.js`.
- **Preconditions:** Multiple customer bookings in various states.

### TS-07: Electronic Payment Processing (UPI/CARD) and Atomic Confirmation
- **Objective:** Verify checkout payment handling for electronic methods (`UPI`, `CARD`). Confirm that submitting payment for an owned `PENDING` booking creates a payment document in `PAID` status with populated `paidAt` timestamp, generates a unique transaction reference, and atomically transitions the booking from `PENDING` to `CONFIRMED` within the same MongoDB transaction.
- **Components:** `src/services/payment.service.js`, `src/controllers/payment.controller.js`, `src/models/Payment.js`.
- **Preconditions:** Customer-owned booking in `PENDING` status.

### TS-08: Cash-on-Pickup Payment Initiation and Physical Handover Collection
- **Objective:** Test the full cash-on-pickup lifecycle. Verify that selecting `CASH_ON_PICKUP` records a payment with status `PENDING` and `paidAt: null` while leaving the booking in `PENDING` status. Verify that an administrator can confirm the booking prior to pickup. At physical garment handover, verify that transitioning the booking to `PICKED_UP` atomically collects cash, updates the existing payment record to `PAID` with timestamp, and advances the booking status.
- **Components:** `src/services/payment.service.js`, `src/controllers/booking.controller.js`.
- **Preconditions:** Booking in `PENDING` or `CONFIRMED` state with pending cash payment record.

### TS-09: Duplicate Payment Prevention and Transaction Rollback Integrity
- **Objective:** Ensure financial idempotency and database consistency. Verify that duplicate payment requests on an already paid or pending booking are rejected with HTTP 400 (`PAYMENT_ALREADY_PROCESSED`). Verify that the unique compound index on `payments.bookingId` prevents duplicate insertion even under concurrent race conditions. Confirm that simulated transaction aborts cleanly roll back created payment records.
- **Components:** `src/models/Payment.js`, `src/services/payment.service.js`, `src/utils/transactionHelper.js`.
- **Preconditions:** Existing booking with payment record.

### TS-10: Administrative Booking Refund Processing and Eligibility Enforcement
- **Objective:** Test administrative refund workflows. Confirm that only administrators can call `POST /api/payments/:id/refund`. Verify that refunds are strictly permitted only when the underlying booking is in `CANCELLED` status and payment is `PAID`. Ensure that uncollected cash payments (`PENDING`) and non-cancelled bookings are rejected with HTTP 400 (`PAYMENT_NOT_REFUNDABLE`). Verify duplicate refund prevention.
- **Components:** `src/services/payment.service.js`, `src/controllers/payment.controller.js`.
- **Preconditions:** Cancelled booking with a `PAID` payment record.

### TS-11: Physical Returns, Late Fine Computation, and Data Masking
- **Objective:** Verify administrator garment return processing via `POST /api/returns`. Validate UTC calendar-day late fee calculation (₹100/day for days beyond `returnDate`). Ensure initial return status is assigned based on condition and timeliness (`RETURNED`, `LATE`, `DAMAGED`). Verify that booking transitions to `RETURNED`. Verify that customer queries (`GET /api/returns/:id`) mask `damageCharge` and `depositRefunded` as `null` until return is settled.
- **Components:** `src/controllers/return.controller.js`, `src/utils/calculateFine.js`, `src/models/Return.js`.
- **Preconditions:** Booking in `PICKED_UP` or `OVERDUE` status.

### TS-12: Security Deposit Settlement, Damage Deductions, and Finalization
- **Objective:** Verify administrator settlement via `POST /api/returns/:id/settle`. Validate that assessed damage charge cannot exceed security deposit (HTTP 400). Verify calculated deposit refund: `depositRefunded = max(0, securityDeposit - damageCharge)`. Confirm that return is marked `settled = true`, `settledAt` is recorded, and booking transitions to `COMPLETED`. Ensure repeated settlement attempts are rejected with HTTP 409 (`SETTLEMENT_ALREADY_COMPLETED`).
- **Components:** `src/controllers/return.controller.js`, `src/services/booking.service.js`, `src/models/Return.js`.
- **Preconditions:** Return record created in unsettled state (`settled: false`).
