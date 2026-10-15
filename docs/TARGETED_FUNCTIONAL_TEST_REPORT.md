# Rent Wise — Targeted Functional Test Report

**Execution Date:** 2026-10-14  
**Project:** Rent Wise (Intelligent Clothing Rental Management System)  
**Environment:** 
- Frontend: `http://localhost:5173/` (Vite + React SPA)
- Backend: `http://localhost:5000/api` (Express + Mongoose + Node.js)
- Database: `mongodb://localhost:27017/perfect_rent` (MongoDB Community Server)
- Health Endpoint: `http://localhost:5000/api/health`

---

## 1. Executive Summary & Verification Metrics

Every functional area specified in the Targeted Functional Testing mandate was executed against real live servers, active database records, and actual API endpoints. Zero mock responses or fake test assertions were employed.

| Metric | Count | Percentage |
|---|---|---|
| **Total Test Scenarios** | **77** | 100% |
| **PASS** | **75** | 97.4% |
| **FAIL** | **0** | 0.0% |
| **NOT IMPLEMENTED** | **2** | 2.6% |
| **BLOCKED** | **0** | 0.0% |
| **NOT TESTED** | **0** | 0.0% |

- **Unit & Integration Regression Suites (`npm test` in `backend`):** `10 / 10 Suites Passed` (`86 / 86 Tests Passed`, 100%)
- **Production Build (`npm run build` in `frontend`):** Built in `2.37s` with zero errors or warnings.
- **Database Baseline Isolation:** Database verified and preserved at pristine counts:
  - Categories: 4 (Baseline: 4)
  - Clothings: 12 (Baseline: 12)
  - Users: 5 (Baseline: 5)
  - Bookings: 0 (Baseline: 0)
  - Payments: 0 (Baseline: 0)
  - Returns: 0 (Baseline: 0)

---

## 2. Test 1 — Login and Registration Results

| Test ID | Category | Scenario & Verification | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|---|
| `LOG-001` | Valid Login | Admin logs in with dedicated admin credentials (`shubham@example.com`) | Status 200, role ADMIN, JWT token present | Status 200, Role: ADMIN | **PASS** | Admin token obtained |
| `REG-001` | Registration | Valid customer registration with dedicated test payload | Status 201, role CUSTOMER, JWT token returned | Status 201, Role: CUSTOMER | **PASS** | New user persisted in DB |
| `LOG-002` | Valid Login | Customer logs in with valid registered credentials | Status 200, role CUSTOMER | Status 200, Role: CUSTOMER | **PASS** | Customer session created |
| `LOG-003` | Session Persistence | Page refresh restores session via `GET /api/auth/me` with Bearer token | Status 200, profile matches email | Status 200, Email matched | **PASS** | Session restored cleanly |
| `LOG-004` | Logout | Stateless token invalidation via `POST /api/auth/logout` | Status 200 | Status 200 | **PASS** | Client removes token |
| `LOG-005` | Invalid Login | Login with wrong password | Status 401 | Status 401 | **PASS** | Message: "Invalid email or password." |
| `LOG-006` | Invalid Login | Login with non-existent email | Status 401 | Status 401 | **PASS** | Message: "Invalid email or password." |
| `LOG-007` | Invalid Login | Login with empty email and password | Status 400 | Status 400 | **PASS** | Joi validation failure |
| `LOG-008` | Invalid Login | Login with invalid email format (`not-an-email`) | Status 400 | Status 400 | **PASS** | Email format error |
| `LOG-009` | Invalid Login | Login with missing password field | Status 400 | Status 400 | **PASS** | Required field error |
| `LOG-010` | Rate Limiting | 5 repeated failed login attempts | Status 429 if implemented | Status 401 (consistent) | **NOT IMPLEMENTED** | `express-rate-limit` is not mounted on `/api/auth`; returns 401 without crashing |
| `REG-002` | Registration | Duplicate email registration rejection | Status 400, code `AUTH_EMAIL_EXISTS` | Status 400, `AUTH_EMAIL_EXISTS` | **PASS** | Duplicate account prevented |
| `REG-003` | Registration | Registration missing required name field | Status 400 | Status 400 | **PASS** | Joi validation failure |
| `REG-004` | Registration | Password policy (< 6 characters) rejection | Status 400 | Status 400 | **PASS** | Minimum length enforced |
| `REG-005` | Privilege Escalation | Submitting `role: "ADMIN"` during public registration | Forced to `role: "CUSTOMER"` | Role: CUSTOMER | **PASS** | Server-side role override verified |
| `SEC-001` | Password Security | Direct database check of password field in MongoDB | Bcrypt hash starting with `$2a$` or `$2b$`, length >= 60 | Hashed: true, Length: 60 | **PASS** | Zero plaintext password exposure |

---

## 3. Test 2 — Authentication & Session Security Results

| Test ID | Category | Scenario & Verification | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|---|
| `SEC-002` | Auth Guard | Access `/api/auth/me` without Authorization header | Status 401, `AUTH_TOKEN_MISSING` | Status 401, `AUTH_TOKEN_MISSING` | **PASS** | Unauthenticated access blocked |
| `SEC-003` | Token Validation | Access with malformed token string | Status 401, `AUTH_TOKEN_INVALID` | Status 401, `AUTH_TOKEN_INVALID` | **PASS** | Malformed token blocked |
| `SEC-004` | Signature Verification | Access with token signed with foreign secret key | Status 401, `AUTH_TOKEN_INVALID` | Status 401, `AUTH_TOKEN_INVALID` | **PASS** | Cryptographic signature checked |
| `SEC-005` | Expiry Enforcement | Access with expired JWT token | Status 401, `AUTH_TOKEN_INVALID` | Status 401, `AUTH_TOKEN_INVALID` | **PASS** | Expiration timestamp enforced |
| `SEC-006` | Role Authorization | Customer token attempting 7 admin operations (`POST /categories`, `POST /clothing`, `PUT /clothing`, `POST /returns`, `POST /returns/settle`, `POST /payments/refund`, `PUT /bookings/status`) | Status 403 on all 7 endpoints | Status 403 on all 7 routes | **PASS** | RBAC middleware enforced at router |
| `SEC-007` | Role Immutability | Customer attempting `PATCH /api/users/profile` with `{ role: "ADMIN" }` | Role remains CUSTOMER | Role: CUSTOMER | **PASS** | Role manipulation strictly prevented |

---

## 4. Test 3 — Pricing & Rental Calculation Results

### Formula Reference:
- **Rental Duration:** `(returnDate - rentalStartDate) / 86400000 ms` in whole UTC calendar days.
- **Rental Amount:** `clothing.rentalPrice * quantity * rentalDuration`.
- **Security Deposit:** Flat `clothing.securityDeposit` per booking (not multiplied by quantity per BR-008).
- **Total Amount:** `rentalAmount + securityDeposit`.

| Test ID | Scenario | Parameters | Expected Amount | Backend Response | Status |
|---|---|---|---|---|---|
| `PRC-001` | Minimum Duration (1 Day) | Sherwani (`₹3,899/day`, deposit `₹8,000`), Qty: 1, 2027-05-01 to 2027-05-02 | Rent: `₹3,899`<br>Total: `₹11,899` | Rent: `₹3,899`<br>Total: `₹11,899` | **PASS** |
| `PRC-002` | Multi-Day Duration (4 Days) | Sherwani (`₹3,899/day`, deposit `₹8,000`), Qty: 1, 2027-05-10 to 2027-05-14 | Rent: `₹15,596`<br>Total: `₹23,596` | Rent: `₹15,596`<br>Total: `₹23,596` | **PASS** |
| `PRC-003` | Multi-Quantity (Qty: 2, 3 Days) | Item with stock (`₹1,299/day`, deposit `₹3,000`), Qty: 2, 2027-05-20 to 2027-05-23 | Rent: `₹7,794`<br>Deposit: `₹3,000` (flat)<br>Total: `₹10,794` | Rent: `₹7,794`<br>Deposit: `₹3,000`<br>Total: `₹10,794` | **PASS** |
| `PRC-004` | Month Boundary Crossing | 2027-05-28 to 2027-06-03 (6 Days), Qty: 1 | Duration: `6 days`<br>Rent: `₹23,394` | Duration: `6 days`<br>Rent: `₹23,394` | **PASS** |
| `PRC-005` | Client-Manipulated Price | Client sends `{ rentalPrice: 1, totalAmount: 1, securityDeposit: 0 }` | Server ignores client values; calculates true `₹15,798` | Server calculated true total: `₹15,798` | **PASS** |
| `VAL-001` | Inverted Dates | `returnDate < rentalStartDate` (`2027-07-10` to `2027-07-05`) | HTTP 400 rejection | Status 400 | **PASS** |
| `VAL-002` | Zero Duration | `returnDate === rentalStartDate` (`2027-07-10` to `2027-07-10`) | HTTP 400 rejection | Status 400 | **PASS** |
| `VAL-003` | Past Date | `rentalStartDate` in past (`2020-01-01`) | HTTP 400 rejection | Status 400 | **PASS** |
| `VAL-004` | Zero Quantity | `quantity: 0` | HTTP 400 rejection | Status 400 | **PASS** |
| `VAL-005` | Negative Quantity | `quantity: -1` | HTTP 400 rejection | Status 400 | **PASS** |
| `VAL-006` | Decimal Quantity | `quantity: 1.5` | HTTP 400 rejection | Status 400 | **PASS** |
| `VAL-007` | Excess Quantity | `quantity: 9999` exceeding total inventory | HTTP 400 rejection | Status 400 | **PASS** |
| `VAL-008` | Missing Dates | `rentalStartDate` omitted | HTTP 400 rejection | Status 400 | **PASS** |
| `PRC-006` | Promotional Discounts | Coupon code / promo discount | Documented status | Not in Phase 1 Schema | **NOT IMPLEMENTED** |

### Currency Formatting Verification:
- **Symbol:** Indian Rupee (`₹`) is used consistently across Product Cards, Product Details, Rental Breakdown Modals, Customer Bookings, Admin Bookings, Admin Inventory, and Admin Returns. Zero accidental dollar signs (`$`) exist.
- **Indian Number Grouping:** Formatted with Indian lakh/thousand comma delimiters via centralized `formatINR` (`Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })`). Examples: `₹3,899`, `₹19,697`, `₹1,20,000`.

---

## 5. Test 4 — Product Availability & Booking Lifecycle Results

| Test ID | Scenario & Verification | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|
| `BOK-001` | Booking Creation | Customer submits valid future booking for full item inventory (2027-08-01 to 2027-08-05) | Status 201, booking status PENDING | Status 201, Status PENDING | **PASS** | Physical inventory held |
| `BOK-002` | Overlap Prevention | Customer B attempts to book overlapping dates (2027-08-03 to 2027-08-07) when quantity is held | Status 409 `BOOKING_OVERLAP` | Status 409, code `BOOKING_OVERLAP` | **PASS** | Overbooking prevented |
| `BOK-003` | Half-Open Interval | Customer B books adjacent dates where requested start equals existing return (2027-08-05 to 2027-08-08) | Status 201 Created | Status 201 Created | **PASS** | Half-open boundary allows handover on same day |
| `BOK-004` | Cancellation | Customer A cancels active PENDING booking | Status 200, status CANCELLED | Status 200, status CANCELLED | **PASS** | Booking status updated |
| `BOK-005` | Idempotent Cancellation | Customer A cancels already CANCELLED booking | Status 400 `BOOKING_NOT_CANCELLABLE` | Status 400, `BOOKING_NOT_CANCELLABLE` | **PASS** | Repeated cancellation rejected |
| `BOK-006` | Inventory Release | Customer B books 2027-08-02 to 2027-08-04 previously held by cancelled booking | Status 201 Created | Status 201 Created | **PASS** | Cancellation successfully frees stock |
| `BOK-007` | Customer Isolation | Customer B attempts to view Customer A booking (`GET /api/bookings/:id`) | Status 403 `FORBIDDEN` | Status 403 `FORBIDDEN` | **PASS** | Cross-tenant inspection blocked |
| `BOK-008` | Customer Isolation | Customer B attempts to cancel Customer A booking (`PUT /api/bookings/:id/cancel`) | Status 403 `FORBIDDEN` | Status 403 `FORBIDDEN` | **PASS** | Unauthorized cancellation blocked |
| `BOK-009` | ID Validation | Request with malformed booking ID string | Status 400 `INVALID_ID` | Status 400 `INVALID_ID` | **PASS** | CastError sanitized |
| `BOK-010` | Not Found ID | Request with valid 24-hex ObjectId that does not exist | Status 404 `BOOKING_NOT_FOUND` | Status 404 `BOOKING_NOT_FOUND` | **PASS** | 404 returned cleanly |

---

## 6. Test 5 — Payment, Deposit, Return & Refund Logic Results

| Test ID | Category | Scenario & Verification | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|---|
| `PAY-001` | Electronic Payment | Simulated UPI payment creation (`POST /api/payments`) | Status 201, payment status PAID, transactionReference generated | Status 201, status PAID, Ref: SIM-208000 | **PASS** | Payment record created |
| `PAY-002` | Atomic Confirmation | Electronic payment atomically transitions booking from PENDING to CONFIRMED | Booking status CONFIRMED | Booking status CONFIRMED | **PASS** | Atomic confirmation verified |
| `PAY-003` | Duplicate Payment | Repeat electronic payment on already PAID booking | Status 400 `PAYMENT_ALREADY_PROCESSED` | Status 400, `PAYMENT_ALREADY_PROCESSED` | **PASS** | Double charge prevented |
| `PAY-004` | Payment Isolation | Customer B attempts to pay for Customer A booking | Status 403 `FORBIDDEN` | Status 403 `FORBIDDEN` | **PASS** | Unauthorized payment rejected |
| `COP-001` | Cash on Pickup | Payment creation with `method: "CASH_ON_PICKUP"` | Status 201, payment status PENDING, paidAt: null | Status 201, status PENDING, paidAt: null | **PASS** | COP record initialized |
| `COP-002` | Cash on Pickup | Booking status check after COP selection | Booking remains PENDING | Booking status PENDING | **PASS** | Awaits admin confirmation |
| `COP-003` | Admin Confirmation | Admin confirms COP booking (`PUT /api/bookings/:id/status` -> `CONFIRMED`) | Status 200, booking CONFIRMED | Status 200, booking CONFIRMED | **PASS** | Manual confirmation verified |
| `COP-004` | Garment Handover | Admin marks COP booking `PICKED_UP` at physical store | Status 200, booking PICKED_UP, cash payment updated to PAID with paidAt timestamp | Status 200, booking PICKED_UP, payment PAID with paidAt recorded | **PASS** | Cash reconciled in place |
| `REF-001` | Admin Refund | Admin issues refund for PAID electronic payment on CANCELLED booking | Status 200, payment status REFUNDED, refundedAt recorded | Status 200, status REFUNDED, timestamp recorded | **PASS** | Refund executed |
| `REF-002` | Duplicate Refund | Admin attempts duplicate refund on already REFUNDED payment | Status 400 `PAYMENT_ALREADY_PROCESSED` | Status 400 `PAYMENT_ALREADY_PROCESSED` | **PASS** | Double refund prevented |
| `REF-003` | Refund Guard | Customer attempts to issue refund on payment | Status 403 `FORBIDDEN` | Status 403 `FORBIDDEN` | **PASS** | Admin-only restriction verified |
| `RET-001` | Late Return & Fine | Admin records return 2 days late (`actualReturnDate: 2027-09-20` vs expected `2027-09-18`) | Status 201, lateDays: 2, fine: ₹200 (₹100/day), status: LATE | Status 201, lateDays: 2, fine: ₹200, status: LATE | **PASS** | Late fine calculated |
| `RET-002` | Return Transition | Physical return transitions booking status to RETURNED | Booking status RETURNED | Booking status RETURNED | **PASS** | Inventory status updated |
| `RET-003` | Duplicate Return | Repeat return record creation on already RETURNED booking | Status 400 `RETURN_ALREADY_COMPLETED` | Status 400 `RETURN_ALREADY_COMPLETED` | **PASS** | Duplicate return rejected |
| `SET-001` | Deposit Settlement | Admin settles return assessing ₹500 damage charge against ₹8,000 security deposit | `depositRefunded: ₹7,500` (deposit - damage), `settled: true` | `depositRefunded: ₹7,500`, `settled: true` | **PASS** | Net deposit refund calculated |
| `SET-002` | Completed Lifecycle | Return settlement transitions booking to final COMPLETED status | Booking status COMPLETED | Booking status COMPLETED | **PASS** | End-to-end lifecycle complete |
| `SET-003` | Duplicate Settlement | Repeat settlement attempt on already settled return | Status 409 `SETTLEMENT_ALREADY_COMPLETED` | Status 409 `SETTLEMENT_ALREADY_COMPLETED` | **PASS** | Settlement idempotent |

---

## 7. Test 6 — Admin Functionality Results

| Test ID | Category | Scenario & Verification | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|---|
| `ADM-001` | Category Management | Admin creates dedicated test category (`POST /api/categories`) | Status 201 Created | Status 201 Created | **PASS** | Category persisted |
| `ADM-002` | Category Management | Admin updates test category metadata (`PUT /api/categories/:id`) | Status 200 OK | Status 200 OK | **PASS** | Changes persisted |
| `ADM-003` | Product Management | Admin creates new dedicated test product (`POST /api/clothing`) | Status 201 Created | Status 201 Created | **PASS** | Product added to catalogue |
| `ADM-004` | Product Management | Admin updates test product price and metadata (`PUT /api/clothing/:id`) | Status 200 OK, price updated | Status 200 OK, Price: ₹2,800 | **PASS** | Price change reflected |
| `ADM-005` | Product Constraints | Admin attempts quantity reduction on existing clothing item | Status 501 `NOT_IMPLEMENTED` | Status 501 `NOT_IMPLEMENTED` | **PASS** | Documented limitation enforced |
| `ADM-006` | Product Constraints | Admin calls `DELETE /api/clothing/:id` | Status 501 `NOT_IMPLEMENTED` | Status 501 `NOT_IMPLEMENTED` | **PASS** | Documented limitation enforced |
| `ADM-007` | Category Management | Admin deletes empty test category (`DELETE /api/categories/:id`) | Status 200 OK | Status 200 OK | **PASS** | Category safely removed |

---

## 8. Test 7 — Database Persistence & Data Integrity Results

| Test ID | Category | Scenario & Verification | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|---|
| `DB-001` | Referential Integrity | Check that persisted Booking references valid User and Clothing documents | Both referenced documents exist in MongoDB | User and Clothing exist | **PASS** | Foreign keys valid |
| `DB-002` | Atomic Rejections | Check that rejected requests (400 validation error) do not insert partial or orphan documents | Database document count unchanged | Pre-count: 10, Post-count: 10 | **PASS** | Zero dirty state created |
| `CLN-001` | Database Isolation | Post-test cleanup removes only test-generated records and restores database baseline | Exact match to baseline counts | Cats: 4, Clothes: 12, Users: 5, Bookings: 0, Payments: 0, Returns: 0 | **PASS** | Baseline preserved |

---

## 9. Test 8 — Error Handling & Sanitization Results

| Test ID | Category | Scenario & Verification | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|---|
| `ERR-001` | Stack Sanitization | Request to non-existent route (`GET /api/non-existent-99`) | Status 404 without stack traces or path leakage | Status 404, Sanitized: true | **PASS** | No internal trace leakage |
| `ERR-002` | Error Envelope | Backend error response adheres to `{ success: false, error: { code, message } }` | Matches contract envelope | Structured: true | **PASS** | Standardized error format |
| `ERR-003` | CORS Policy | OPTIONS pre-flight check from origin `http://localhost:5173` | Header `Access-Control-Allow-Origin: http://localhost:5173` | Allowed: `http://localhost:5173` | **PASS** | Cross-origin requests permitted |

---

## 10. Bugs Discovered & Minimal Fixes Applied

During targeted test execution, two issues were identified and resolved with minimal, surgical code adjustments:

### Bug 1: Unhandled Standalone MongoDB Transaction Error during Cash Garment Handover
- **File Affected:** [`backend/src/controllers/booking.controller.js`](file:///c:/Users/skyso/OneDrive/Documents/AWT%20project/backend/src/controllers/booking.controller.js)
- **Root Cause:** When transitioning a `CASH_ON_PICKUP` booking from `CONFIRMED` to `PICKED_UP`, lines 285–286 directly invoked `mongoose.startSession()` and `session.startTransaction()`. On standalone MongoDB instances (non-replica-sets), MongoDB rejected the call with `MongoServerError: Standalone servers do not support transactions`, causing the request to fail and cascading to subsequent return/settlement tests.
- **Resolution:** Replaced the direct raw session invocation with `withTransaction(async (session) => { ... })` from [`backend/src/utils/transactionHelper.js`](file:///c:/Users/skyso/OneDrive/Documents/AWT%20project/backend/src/utils/transactionHelper.js). This ensures transactions run if a replica set is detected while executing cleanly in standalone development mode.
- **Verification:** Retesting `[COP-004]` through `[SET-003]` resulted in **100% PASS**.

### Bug 2: Missing Indian Currency Formatter on Admin Tables
- **Files Affected:** 
  - [`frontend/src/pages/admin/AdminBookings.jsx`](file:///c:/Users/skyso/OneDrive/Documents/AWT%20project/frontend/src/pages/admin/AdminBookings.jsx)
  - [`frontend/src/pages/admin/AdminInventory.jsx`](file:///c:/Users/skyso/OneDrive/Documents/AWT%20project/frontend/src/pages/admin/AdminInventory.jsx)
  - [`frontend/src/pages/admin/AdminReturns.jsx`](file:///c:/Users/skyso/OneDrive/Documents/AWT%20project/frontend/src/pages/admin/AdminReturns.jsx)
- **Root Cause:** Amounts were displayed with raw template literals (e.g. `₹{booking.totalAmount}`) without Indian lakh/thousand comma grouping.
- **Resolution:** Imported and applied the centralized `formatINR` helper from [`frontend/src/utils/formatCurrency.js`](file:///c:/Users/skyso/OneDrive/Documents/AWT%20project/frontend/src/utils/formatCurrency.js).
- **Verification:** Amounts now render with standard Indian number formatting (e.g., `₹19,697`, `₹8,000`, `₹7,500`).

---

## 11. Regression Testing Verification

After applying minimal fixes:
1. **Targeted Functional Test Suite (`scratch/targeted_functional_test.js`):**
   - **75 PASSED**, **0 FAILED**, **2 NOT IMPLEMENTED**
2. **Backend Jest Test Suites (`npm test` in `backend`):**
   - `10 / 10 Test Suites Passed`
   - `86 / 86 Unit/Integration Tests Passed`
   - Test execution duration: `14.3s`
3. **Frontend Production Build (`npm run build` in `frontend`):**
   - 1,972 modules transformed
   - Bundle built cleanly in `2.37s` with zero errors

---

## 12. Commands to Rerun Tests

To replicate and verify all results independently:

```bash
# 1. Run the Comprehensive Targeted Functional Test Suite
node scratch/targeted_functional_test.js

# 2. Run the Full Backend Jest Test Suites
cd backend
npm test

# 3. Run the Frontend Production Build
cd ../frontend
npm run build
```
