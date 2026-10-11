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

- **Payment confirmation:** The Payment service MUST pass its active session to `confirmBooking(bookingId, { session })` when recording a successful payment and confirming its Booking. Calling `confirmBooking` without a session MUST NOT be used for this atomic payment flow. The Payment `PAID` update and Booking `CONFIRMED` transition must commit or abort together.
- **Return creation:** Return creation and the associated Booking transition to `RETURNED` must use the same active session. The Return service MUST pass that session to `markBookingReturned(bookingId, { session })`. The Return record and Booking status transition must commit or abort together.
- **Return settlement:** Settlement and the associated Booking transition to `COMPLETED` must use the same active session. The settlement service MUST pass that session to `settleBooking(bookingId, { session })`. The settlement changes and Booking status transition must commit or abort together.

All database operations participating in each atomic operation must use the same session. Transaction retries must not produce duplicate payments, Return records, or settlements. External side effects must not be performed inside a retryable transaction callback.

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

This prevents the frontend from manipulating prices.

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
