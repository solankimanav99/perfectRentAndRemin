# Perfect Rent & Remind – API Contracts

This file is the shared contract between backend and frontend.

## 1. Contract Rules

1. Backend is authoritative for business calculations.
2. Frontend must not invent fields.
3. Frontend must not depend on database-specific fields unless explicitly exposed.
4. IDs are returned as strings.
5. Dates are returned as ISO-8601 strings.
6. Passwords are never returned.
7. Error responses use the common error format.
8. New API fields/endpoints should be documented here before frontend consumption.
9. Breaking contract changes require agreement between frontend and backend developers.

---

# 2. Common Success Response

For single resources:

```json
{
  "success": true,
  "data": {}
}
```

For collections:

```json
{
  "success": true,
  "data": []
}
```

When useful, a message may be included:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

---

# 3. Common Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

Frontend should primarily use:

```text
error.code
```

for programmatic handling.

---

# 4. User Contract

```json
{
  "id": "USER_ID",
  "name": "Alison Solanki",
  "email": "alison@example.com",
  "phone": "9876543210",
  "role": "CUSTOMER"
}
```

Allowed roles:

```text
CUSTOMER
ADMIN
```

Password is never included.

---

# 5. Clothing Contract

```json
{
  "id": "CLOTHING_ID",
  "name": "Royal Sherwani",
  "category": {
    "id": "CATEGORY_ID",
    "name": "Sherwani"
  },
  "description": "Traditional wedding sherwani",
  "size": "L",
  "color": "Black",
  "rentalPrice": 1500,
  "securityDeposit": 3000,
  "quantity": 5,
  "availableQuantity": 3,
  "image": "/images/sherwani.jpg",
  "condition": "GOOD",
  "availabilityStatus": "AVAILABLE"
}
```

### Clothing condition

Recommended values:

```text
EXCELLENT
GOOD
FAIR
MAINTENANCE
```

### Availability status

```text
AVAILABLE
UNAVAILABLE
MAINTENANCE
```

`availableQuantity` is a calculated availability value when a date range is supplied.

---

# 6. Category Contract

```json
{
  "id": "CATEGORY_ID",
  "name": "Sherwani",
  "description": "Traditional wedding wear"
}
```

---

# 7. Booking Contract

```json
{
  "id": "BOOKING_ID",
  "customerId": "USER_ID",
  "clothingId": "CLOTHING_ID",
  "rentalStartDate": "2026-10-20T00:00:00.000Z",
  "returnDate": "2026-10-22T00:00:00.000Z",
  "quantity": 2,
  "rentalDuration": 2,
  "rentalAmount": 6000,
  "securityDeposit": 3000,
  "totalAmount": 9000,
  "status": "PENDING",
  "createdAt": "2026-10-08T10:00:00.000Z",
  "updatedAt": "2026-10-08T10:00:00.000Z"
}
```

### Booking statuses

```text
PENDING
CONFIRMED
PICKED_UP
RETURNED
COMPLETED
CANCELLED
OVERDUE
```

Reservable statuses (hold inventory): `PENDING`, `CONFIRMED`, `PICKED_UP`,
`OVERDUE` (see BR-030).

Allowed status transitions are defined in BR-036; an invalid transition returns
`BOOKING_INVALID_STATUS`.

### Shared Booking Service and Transaction Contract

The caller owns the MongoDB transaction and must pass its active Mongoose session to shared Booking Service methods when the associated database changes must commit or abort atomically.

- **Payment confirmation (Electronic):** For electronic payments (`UPI`, `CARD`), the Payment service MUST pass its active session to `confirmBooking(bookingId, { session })` when recording a successful payment (`PAID`) and confirming its Booking (`PENDING -> CONFIRMED`). Calling `confirmBooking` without a session MUST NOT be used for this atomic payment flow. The Payment `PAID` update and Booking `CONFIRMED` transition must commit or abort together in the same MongoDB transaction. An administrator cannot manually confirm an unpaid electronic booking.
- **Cash on pickup confirmation:** For `CASH_ON_PICKUP`, `POST /payments` creates exactly one payment record with status `PENDING` and `paidAt: null`. An administrator may confirm the booking (`PENDING -> CONFIRMED`) while that existing cash payment remains `PENDING`. Confirmation is permitted only when the booking has an existing `PENDING` payment whose method is `CASH_ON_PICKUP`. An unpaid booking without a payment record cannot be manually confirmed.
- **Cash pickup handover:** When an admin records cash collection at physical handover for a `CASH_ON_PICKUP` booking, the active session MUST be passed to `markBookingPickedUp(bookingId, { session })`. The existing pending payment update to `PAID` and the Booking `CONFIRMED -> PICKED_UP` transition must commit or abort together atomically in the same MongoDB transaction. Calling `markBookingPickedUp` without recording the cash payment update in the same session MUST NOT be used for `CASH_ON_PICKUP` bookings. Do not create a second payment record.
- **Return creation:** Return creation and the associated Booking transition to `RETURNED` must use the same active session. The Return service MUST pass that session to `markBookingReturned(bookingId, { session })`. The Return record and Booking status transition must commit or abort together.
- **Return settlement:** Settlement and the associated Booking transition to `COMPLETED` must use the same active session. The settlement service MUST pass that session to `settleBooking(bookingId, { session })`. The settlement changes and Booking status transition must commit or abort together.

#### Documented Cash Pickup Transaction Sequence

For cash pickup, the admin workflow MUST execute the following sequence:

1. Verify the booking exists and is `CONFIRMED`.
2. Verify the booking payment method is `CASH_ON_PICKUP`.
3. Verify the associated pending payment exists, belongs to the booking, has status `PENDING`, and has `amount` equal to the booking `totalAmount`.
4. Within one MongoDB transaction session, update that existing payment to status `PAID` (recording `paidAt`), and invoke `markBookingPickedUp(bookingId, { session })`.
5. Commit both changes together.
6. If either change fails, roll back both.

All database operations participating in each atomic operation must use the same session. Transaction retries must not produce duplicate payments, duplicate collections, Return records, settlements, or duplicate state transitions. External side effects must not be performed inside a retryable transaction callback. Return HTTP `409` with `BOOKING_OVERLAP` only when a fresh availability/inventory calculation establishes that the requested quantity is unavailable for the requested rental period. Exhausting bounded transaction retries due to transient database conflicts does not, by itself, prove inventory is insufficient and MUST NOT be mapped to `BOOKING_OVERLAP`. If retries are exhausted without proving insufficient inventory, return HTTP `500` with `DATABASE_ERROR`.

---

# 8. Payment Contract

```json
{
  "id": "PAYMENT_ID",
  "bookingId": "BOOKING_ID",
  "customerId": "USER_ID",
  "amount": 9000,
  "method": "UPI",
  "status": "PAID",
  "transactionReference": "SIM-123456",
  "paidAt": "2026-10-08T10:10:00.000Z",
  "refundedAt": null,
  "refundReason": null
}
```

### Payment methods

```text
UPI
CARD
CASH_ON_PICKUP
```

### Payment statuses

```text
PENDING
PAID
FAILED
REFUNDED
```

### Representation of CASH_ON_PICKUP

- **Created (pending pickup):**
  - `status: "PENDING"`
  - `paidAt: null`
  - `amount`: equals booking `totalAmount`
  - Unpaid cash payments do not count toward revenue.
- **Collected at handover:**
  - `status: "PAID"`
  - `paidAt: "<ISO-8601 UTC timestamp>"`
  - The existing record is updated in place. No second payment record is created.

### Payment Cardinality and Unique Constraint

- Each booking has at most one payment record (`payments.bookingId` is a UNIQUE index).
- Creating a second payment record for the same booking is prohibited.
- The backend must handle database duplicate-key errors (`code: 11000` / `E11000`) safely on concurrent creation attempts and return `PAYMENT_ALREADY_PROCESSED`.

---

# 9. Return Contract

```json
{
  "id": "RETURN_ID",
  "bookingId": "BOOKING_ID",
  "clothingId": "CLOTHING_ID",
  "customerId": "USER_ID",
  "expectedReturnDate": "2026-10-20T00:00:00.000Z",
  "actualReturnDate": "2026-10-22T00:00:00.000Z",
  "lateDays": 2,
  "fine": 200,
  "condition": "GOOD",
  "status": "LATE",
  "damageCharge": 0,
  "depositRefunded": 3000,
  "finePaid": true,
  "settled": true,
  "settledAt": "2026-10-22T10:00:00.000Z"
}
```

### Return statuses

```text
PENDING
RETURNED
LATE
DAMAGED
```

### Return condition

```text
EXCELLENT
GOOD
FAIR
DAMAGED
```

`DAMAGED` as the returned condition sets the return status to `DAMAGED`
(see BR-038).

---

# 10. Notification Contract

```json
{
  "id": "NOTIFICATION_ID",
  "customerId": "USER_ID",
  "bookingId": "BOOKING_ID",
  "type": "RETURN_3_DAYS",
  "message": "Your clothing rental is due in 3 days.",
  "scheduledFor": "2026-10-17T09:00:00.000Z",
  "isRead": false
}
```

### Notification types

```text
RETURN_3_DAYS
RETURN_1_DAY
RETURN_DUE_TODAY
RETURN_OVERDUE
BOOKING_CONFIRMED
BOOKING_CANCELLED
PAYMENT_SUCCESS
PAYMENT_FAILED
```

---

# 11. Availability Contract

```json
{
  "clothingId": "CLOTHING_ID",
  "startDate": "2026-10-20",
  "endDate": "2026-10-22",
  "requestedQuantity": 2,
  "totalQuantity": 5,
  "reservedQuantity": 2,
  "availableQuantity": 3,
  "available": true
}
```

---

# 12. Dashboard Contract

```json
{
  "totalCustomers": 120,
  "totalClothingItems": 85,
  "availableItems": 62,
  "activeRentals": 18,
  "pendingBookings": 7,
  "overdueRentals": 3,
  "monthlyRevenue": 125000
}
```

`availableItems` is a count of distinct clothing products that are currently
available, not the sum of their physical units.

---

# 13. Pagination Contract

Collection endpoints that support pagination should use:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 12,
    "totalItems": 100,
    "totalPages": 9
  }
}
```

Query parameters:

```text
page
limit
```

Default:

```text
page = 1
limit = 12
```

These defaults apply to every paginated list endpoint.

---

# 14. Date Contract

API dates use ISO-8601 strings.

Example:

```text
2026-10-20T00:00:00.000Z
```

Date-only query parameters may use:

```text
2026-10-20
```

A date-only value is interpreted as UTC midnight (`2026-10-20T00:00:00.000Z`).

Backend must normalize and validate dates consistently.

All resource responses return full ISO-8601 UTC timestamps
(`2026-10-20T00:00:00.000Z`). Date-only values (`2026-10-20`) are accepted only
as query/request inputs, never as response values.

Frontend should not assume a local date string is a UTC timestamp unless explicitly
documented.

---

# 15. Authentication Contract

Protected requests use:

```http
Authorization: Bearer <JWT_TOKEN>
```

The backend authenticates the token and exposes the current user internally as:

```text
req.user
```

The JWT payload carries the user id (`sub`) and `role`, and expires after
`JWT_EXPIRES_IN`.

The frontend must not send:

```text
password
role
userId
```

as a substitute for authentication.

---

# 16. Booking Creation Contract

Frontend sends only:

```json
{
  "clothingId": "CLOTHING_ID",
  "rentalStartDate": "2026-10-20",
  "returnDate": "2026-10-22",
  "quantity": 2
}
```

Backend calculates:

```text
rentalDuration
rentalAmount
securityDeposit
totalAmount
availability
```

This prevents the frontend from manipulating prices. Overlapping bookings must never reserve more than the item's `quantity`. If a fresh availability calculation proves that insufficient inventory exists for the requested rental period, reject the booking with HTTP `409` and `BOOKING_OVERLAP`. Exhausting bounded transient transaction retries does not, by itself, prove insufficient inventory and MUST NOT be mapped to `BOOKING_OVERLAP`. If retries are exhausted without proving insufficient inventory, return HTTP `500` with `DATABASE_ERROR`.

---

# 17. Payment Creation Contract

Frontend sends:

```json
{
  "bookingId": "BOOKING_ID",
  "method": "UPI"
}
```

Backend determines:

```text
amount
transactionReference
status
paidAt
```

Rules by payment method:

- **Electronic (`UPI`, `CARD`):** The backend sets `amount = booking.totalAmount`, simulated `status = PAID`, records `paidAt`, and automatically transitions the booking to `CONFIRMED` atomically in the same MongoDB transaction. An administrator cannot manually confirm an unpaid electronic booking.
- **Cash on pickup (`CASH_ON_PICKUP`):** `POST /payments` creates exactly one payment record with `amount = booking.totalAmount`, `status = PENDING`, and `paidAt = null`. An administrator may confirm the booking (`PENDING -> CONFIRMED`) while that existing cash payment remains `PENDING`. Confirmation is permitted only when the booking has an existing `PENDING` payment whose method is `CASH_ON_PICKUP`. An unpaid booking without a payment record cannot be manually confirmed. At physical handover, the administrator updates the existing cash payment to `PAID` and transitions the booking (`CONFIRMED -> PICKED_UP`) atomically in the same MongoDB transaction without creating a second payment record.
- Exactly one payment record is permitted per booking (`payments.bookingId` is UNIQUE). Attempting to pay or initiate payment for a booking that already has a payment record returns `PAYMENT_ALREADY_PROCESSED`. The backend must catch duplicate-key errors (`code: 11000`) on concurrent creation and safely return `PAYMENT_ALREADY_PROCESSED`.
- Frontend must not send `amount`, `status`, or `paidAt`.

---

# 18. Return Creation Contract

Frontend/admin client sends:

```json
{
  "bookingId": "BOOKING_ID",
  "actualReturnDate": "2026-10-22",
  "condition": "GOOD"
}
```

Backend calculates:

```text
lateDays
fine
return status
```

---

# 19. Frontend State Expectations

Frontend should be prepared for these states:

### Clothing

```text
AVAILABLE
UNAVAILABLE
MAINTENANCE
```

### Booking

```text
PENDING
CONFIRMED
PICKED_UP
RETURNED
COMPLETED
CANCELLED
OVERDUE
```

### Payment

```text
PENDING
PAID
FAILED
REFUNDED
```

### Return

```text
PENDING
RETURNED
LATE
DAMAGED
```

---

# 20. Contract Ownership

Backend owns:

- Data validation
- Authorization
- Availability
- Pricing
- Fine calculation
- Booking conflict detection
- Database integrity

Frontend owns:

- UI
- Form interaction
- Client-side validation for user experience
- Loading states
- Error display
- API consumption
- Navigation

Frontend validation does not replace backend validation.

---

# 21. Contract Change Rule

Before changing any of the following:

- Endpoint path
- HTTP method
- Request field
- Response field
- Enum value
- Error code
- Authentication requirement

update this file and API_ENDPOINTS.md first, then inform the frontend developer.

Do not silently change the API contract.
