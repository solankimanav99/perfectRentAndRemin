[API_ENDPOINTS (1).md](https://github.com/user-attachments/files/33276476/API_ENDPOINTS.1.md)
# Perfect Rent & Remind – API Endpoints

Base URL:

```
http://localhost:5000/api

```

Authentication:

```
Authorization: Bearer <JWT_TOKEN>

```

Dates:

```
Full timestamps are returned as ISO-8601 UTC strings (e.g. 2026-10-20T00:00:00.000Z).
Date-only request and query values use YYYY-MM-DD (e.g. 2026-10-20) and are interpreted as UTC calendar dates.
Rental duration and late days are calculated using UTC calendar-date differences. Rental periods use a half-open interval: the rental start date is included and the return date is the end boundary. Therefore, 2026-10-20 through 2026-10-22 represents 2 rental days. An actual return on the expected return date is on time and has 0 late days. A return on 2026-10-24 when due on 2026-10-22 is 2 calendar days late.

```

Pagination defaults (all paginated list endpoints):

```
page = 1
limit = 12

```

## Response and validation conventions

- Successful responses use `{"success": true, "data": ...}`; a `message` may also be included.
- Errors use `{"success": false, "error": {"code": "ERROR_CODE", "message": "Human-readable message"}}` and must use the codes documented in `ERROR_CODES.md`.
- List endpoints that support pagination return `data.items` and `data.pagination` with `page`, `limit`, `totalItems`, and `totalPages`.
- The server is authoritative for identity, authorization, prices, deposits, rental duration, availability, payment status, fines, damage charges, and deposit refunds.
- Inventory reservation: a booking reserves inventory only while its status is `PENDING`, `CONFIRMED`, `PICKED_UP`, or `OVERDUE`. Bookings that are `CANCELLED`, `RETURNED`, or `COMPLETED` never reserve inventory. This single rule governs availability checks, booking creation, cancellation, and clothing quantity updates.
- Still-out items: a booking in `PICKED_UP` or `OVERDUE` reserves its quantity from its rental start date through the later of its scheduled return date and the current date, and keeps blocking date-specific availability until the item is actually returned. A garment still physically rented out therefore cannot be offered to another customer, even for dates after its originally scheduled return date.
- Unless stated otherwise, invalid input returns `400`, missing/invalid authentication returns `401`, insufficient role returns `403`, missing resources return `404`, and state conflicts return `409`. For customer-owned resources (bookings, payments, returns, and notifications), return `404` when the resource does not belong to the authenticated customer, so the API does not reveal whether another customer's resource exists.

---

---

# 1. Authentication

## POST /auth/register

Public.

Creates a CUSTOMER account.

### Request

```
{
  "name": "Alison Solanki",
  "email": "alison@example.com",
  "password": "password123",
  "phone": "9876543210"
}
```

### Response 201

```
{
  "success": true,
  "message": "Registration successful.",
  "data": {
    "user": {
      "id": "USER_ID",
      "name": "Alison Solanki",
      "email": "alison@example.com",
      "phone": "9876543210",
      "role": "CUSTOMER"
    },
    "token": "JWT_TOKEN"
  }
}
```

---

## POST /auth/login

Public.

### Request

```
{
  "email": "alison@example.com",
  "password": "password123"
}
```

### Response 200

```
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "USER_ID",
      "name": "Alison Solanki",
      "email": "alison@example.com",
      "phone": "9876543210",
      "role": "CUSTOMER"
    },
    "token": "JWT_TOKEN"
  }
}
```

---

## GET /auth/me

Authenticated.

Returns current user.

### Response

```
{
  "success": true,
  "data": {
    "id": "USER_ID",
    "name": "Alison Solanki",
    "email": "alison@example.com",
    "phone": "9876543210",
    "role": "CUSTOMER"
  }
}
```

---

## POST /auth/logout

Authenticated.

For JWT authentication, logout can be handled client-side by removing the token. The endpoint may still exist for a consistent frontend workflow.

### Response

```
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

# 2. User/Profile

## GET /users/profile

Authenticated.

### Response

```
{
  "success": true,
  "data": {
    "id": "USER_ID",
    "name": "Alison Solanki",
    "email": "alison@example.com",
    "phone": "9876543210",
    "role": "CUSTOMER"
  }
}
```

---

## PATCH /users/profile

Authenticated. Updates only the supplied editable profile fields. Omitted fields remain unchanged. The customer cannot change `email`, `role`, or `id` through this endpoint.

### Request

```json
{
  "name": "Updated Name",
  "phone": "9999999999"
}
```

### Response

```
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": {
    "id": "USER_ID",
    "name": "Updated Name",
    "email": "alison@example.com",
    "phone": "9999999999",
    "role": "CUSTOMER"
  }
}
```

---

# 3. Categories

## GET /categories

Public.

### Response

```
{
  "success": true,
  "data": [
    {
      "id": "CATEGORY_ID",
      "name": "Sherwani",
      "description": "Traditional wedding wear"
    }
  ]
}
```

---

## POST /categories

ADMIN only. Creates a category. The category name must be unique.

### Request

```json
{
  "name": "Sherwani",
  "description": "Traditional wedding wear"
}
```

### Response 201

```json
{
  "success": true,
  "message": "Category created successfully.",
  "data": {
    "id": "CATEGORY_ID",
    "name": "Sherwani",
    "description": "Traditional wedding wear"
  }
}
```

---

## PUT /categories/:id

ADMIN only. Replaces the editable category fields. Both `name` and `description` must be supplied. The category name must remain unique.

### Request

```json
{
  "name": "Wedding Sherwani",
  "description": "Updated description"
}
```

### Response 200

```json
{
  "success": true,
  "message": "Category updated successfully.",
  "data": {
    "id": "CATEGORY_ID",
    "name": "Wedding Sherwani",
    "description": "Updated description"
  }
}
```

---

## DELETE /categories/:id

ADMIN only.

Category deletion must be rejected if any clothing record references the category. Reassign or delete the associated clothing through the supported workflow first.

### Response 200

```json
{
  "success": true,
  "message": "Category deleted successfully."
}
```

---

# 4. Clothing

## GET /clothing

Public.

Supports optional query parameters:

```
search
category
size
color
minPrice
maxPrice
availability
startDate
endDate
page
limit

```

`availability` accepts `true` or `false`. `category` accepts a category name or id. If both `startDate` and `endDate` are supplied, availability is calculated for that rental period using the same reservation rules as `GET /clothing/:id/availability`. If neither date is supplied, `availability=true` means the item is generally bookable (`availabilityStatus` is `AVAILABLE` and quantity is greater than zero); it does not promise date-specific availability. Supplying only one date is invalid and returns `INVALID_DATE_RANGE`.

Example:

```
GET /api/clothing?category=Sherwani&size=L&startDate=2026-10-20&endDate=2026-10-22

```

### Response

```
{
  "success": true,
  "data": {
    "items": [
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
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "totalItems": 1,
      "totalPages": 1
    }
  }
}
```

---

## GET /clothing/:id

Public.

### Response

```
{
  "success": true,
  "data": {
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
    "availableQuantity": 5,
    "image": "/images/sherwani.jpg",
    "condition": "GOOD",
    "availabilityStatus": "AVAILABLE"
  }
}
```

---

## POST /clothing

ADMIN only. Creates a clothing record. `categoryId` must reference an existing category. Prices and quantity must be non-negative, and quantity must be an integer greater than or equal to 1.

### Request

```json
{
  "name": "Royal Sherwani",
  "categoryId": "CATEGORY_ID",
  "description": "Traditional wedding sherwani",
  "size": "L",
  "color": "Black",
  "rentalPrice": 1500,
  "securityDeposit": 3000,
  "quantity": 5,
  "image": "/images/sherwani.jpg",
  "condition": "GOOD",
  "availabilityStatus": "AVAILABLE"
}
```

### Response 201

```json
{
  "success": true,
  "message": "Clothing created successfully.",
  "data": {
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
    "availableQuantity": 5,
    "image": "/images/sherwani.jpg",
    "condition": "GOOD",
    "availabilityStatus": "AVAILABLE"
  }
}
```

---

## PUT /clothing/:id

ADMIN only. Replaces all editable clothing fields. The request must include the same editable fields as `POST /clothing`; omitted required fields return `VALIDATION_ERROR`. `categoryId` must reference an existing category. The backend must reject a quantity reduction that would make existing active/reservable bookings exceed the item's inventory. The backend recalculates `availableQuantity`; clients cannot set it directly.

### Request

Use the same request schema as `POST /clothing`.

### Response 200

```json
{
  "success": true,
  "message": "Clothing updated successfully.",
  "data": {
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
    "availableQuantity": 5,
    "image": "/images/sherwani.jpg",
    "condition": "GOOD",
    "availabilityStatus": "AVAILABLE"
  }
}
```

---

## DELETE /clothing/:id

ADMIN only.

The backend must reject deletion when active/reservable bookings depend on the item.

- If the item has no booking or return history and no active/reservable bookings, delete the record and return `200` with `message: "Clothing deleted successfully."`.
- If the item has historical bookings or returns, preserve the record and set `availabilityStatus` to `UNAVAILABLE`. Return `200` with `message: "Clothing marked as unavailable."` and include the preserved clothing resource in `data`.
- If active/reservable bookings exist, do not delete or change the item's availability status; return `409` with `CLOTHING_HAS_ACTIVE_BOOKINGS` (defined in `ERROR_CODES.md`).

### Response 200 — Deleted

```json
{
  "success": true,
  "message": "Clothing deleted successfully."
}
```

### Response 200 — Preserved as unavailable

```json
{
  "success": true,
  "message": "Clothing marked as unavailable.",
  "data": {
    "id": "CLOTHING_ID",
    "availabilityStatus": "UNAVAILABLE"
  }
}
```

---

# 5. Availability

## GET /clothing/:id/availability

Public.

Query:

```
startDate
endDate
quantity

```

Both `startDate` and `endDate` are required and must be valid UTC date-only values, with `startDate < endDate`. `quantity` must be a positive integer and defaults to 1 if omitted. The response's `available` value is `true` only when the clothing is generally bookable and `availableQuantity >= requestedQuantity`.

Example:

```
GET /api/clothing/CLOTHING_ID/availability?startDate=2026-10-20&endDate=2026-10-22&quantity=2

```

### Response

```
{
  "success": true,
  "data": {
    "clothingId": "CLOTHING_ID",
    "startDate": "2026-10-20",
    "endDate": "2026-10-22",
    "requestedQuantity": 2,
    "totalQuantity": 5,
    "reservedQuantity": 2,
    "availableQuantity": 3,
    "available": true
  }
}
```

---

# 6. Bookings

## POST /bookings

Authenticated CUSTOMER.

### Request

```
{
  "clothingId": "CLOTHING_ID",
  "rentalStartDate": "2026-10-20",
  "returnDate": "2026-10-22",
  "quantity": 2
}
```

### Response 201

```
{
  "success": true,
  "message": "Booking created successfully.",
  "data": {
    "id": "BOOKING_ID",
    "clothingId": "CLOTHING_ID",
    "rentalStartDate": "2026-10-20T00:00:00.000Z",
    "returnDate": "2026-10-22T00:00:00.000Z",
    "quantity": 2,
    "rentalDuration": 2,
    "rentalAmount": 6000,
    "securityDeposit": 3000,
    "totalAmount": 9000,
    "status": "PENDING"
  }
}
```

The security deposit is a flat amount taken from the clothing record and does not multiply by quantity. The backend calculates rental duration, rental amount, security deposit, and total amount; client-supplied totals are never trusted.

Validation rules:

- `rentalStartDate` and `returnDate` must be valid UTC date-only values (`YYYY-MM-DD`).
- `rentalStartDate` must be earlier than `returnDate`.
- `quantity` must be a positive integer.
- The clothing item must be bookable (`availabilityStatus` is `AVAILABLE` and quantity is greater than zero) and must have sufficient inventory for the entire rental period.
- Overlapping bookings must never reserve more than the item's `quantity`. If the requested quantity is not available for the requested dates, the booking is rejected with `BOOKING_OVERLAP`.

---

## GET /bookings

Authenticated.

Customer receives their own bookings.

This endpoint always returns only the caller's own bookings, regardless of role. An admin who needs every booking must use `GET /admin/bookings`; admins do not own bookings, so an admin calling this endpoint normally receives an empty list.

Optional filters:

```
status
page
limit

```

---

## GET /bookings/:id

Authenticated.

A customer may only access their own booking.

Admin may access any booking.

---

## PUT /bookings/:id/cancel

Authenticated CUSTOMER or ADMIN.

A customer may cancel only their own booking. An admin may cancel an eligible booking. Only `PENDING` and `CONFIRMED` bookings may be cancelled; bookings in other statuses return `BOOKING_NOT_CANCELLABLE`. Cancellation must atomically change the booking status to `CANCELLED` and release its reserved inventory. If a `PAID` payment exists for the booking, the cancellation endpoint does not silently perform a refund: an administrator must process the refund using `POST /payments/:id/refund` under BR-031. Until refunded, the payment remains `PAID`. Repeated cancellation attempts are rejected.

### Response

```
{
  "success": true,
  "message": "Booking cancelled successfully.",
  "data": {
    "id": "BOOKING_ID",
    "status": "CANCELLED"
  }
}
```

---

## PUT /bookings/:id/status

ADMIN only.

Used for administrative status transitions that are not handled by dedicated workflow endpoints. Allowed transitions through this endpoint:

```
PENDING    -> CONFIRMED, CANCELLED
CONFIRMED  -> PICKED_UP, CANCELLED

```

The return workflow owns the transitions `PICKED_UP -> RETURNED` and `OVERDUE -> RETURNED`. The settlement workflow owns `RETURNED -> COMPLETED`. Do not use this endpoint to bypass return processing or settlement.

Any unsupported transition returns `BOOKING_INVALID_STATUS`.

Payment requirement: this endpoint must not confirm or advance an unpaid booking. `PENDING -> CONFIRMED` and `CONFIRMED -> PICKED_UP` are rejected with `BOOKING_INVALID_STATUS` unless the booking has a `PAID` payment, so the admin workflow cannot bypass payment. In the normal flow a successful payment already moves a `PENDING` booking to `CONFIRMED`. A `CASH_ON_PICKUP` booking may be advanced only after its cash payment has been recorded as `PAID`.

### Request

```
{
  "status": "CONFIRMED"
}
```

---

# 7. Payments

## POST /payments

Authenticated.

Creates a simulated payment for a booking.

Allowed only for a booking owned by the caller, in status `PENDING` or `CONFIRMED`, with no existing `PAID` payment (see BR-037). An admin cannot create a payment for a customer's booking through this endpoint; payments are created by the booking's own customer. The backend sets the amount, transaction reference and status; the client sends neither.

For the normal college-demo flow, simulated payments succeed by default. A successful payment for a `PENDING` booking transitions that booking to `CONFIRMED`. A failed payment must not confirm the booking. The `FAILED` status is only produced through a controlled test path; clients cannot submit their own payment status or force a payment outcome. Only one `PAID` payment is allowed per booking. A prior `FAILED` payment does not prevent a retry; a prior `PAID` or `REFUNDED` payment does. A `REFUNDED` payment does not make the same booking payable again.

Simulating a failure (development only): a failed payment can be triggered by sending the request header `X-Simulate-Payment: FAILED`, or by using the payment method value `TEST_FAIL`. This hook is honoured only when `NODE_ENV` is not `production`; in production it is ignored, so ordinary clients cannot force a payment outcome. A simulated failure records a payment with status `FAILED` and leaves the booking in its current status (it is not confirmed). A later retry may succeed, and retries never produce more than one `PAID` payment for a booking.

Allowed payment methods: `UPI`, `CARD`, `CASH_ON_PICKUP`. Any other value returns `PAYMENT_INVALID_METHOD`. `TEST_FAIL` is a development-only test value and is not a production payment method; it is rejected as a method when `NODE_ENV=production`. Clients still cannot submit their own payment status or force a payment outcome.

### Request

```
{
  "bookingId": "BOOKING_ID",
  "method": "UPI"
}
```

### Response

```
{
  "success": true,
  "message": "Payment processed successfully.",
  "data": {
    "id": "PAYMENT_ID",
    "bookingId": "BOOKING_ID",
    "amount": 9000,
    "method": "UPI",
    "status": "PAID",
    "transactionReference": "SIM-123456"
  }
}
```

---

## GET /payments

Authenticated.

Returns the current customer's payments.

Optional filters:

```
status
page
limit

```

---

## GET /payments/:id

Authenticated.

Customer can view payment belonging to their booking.

Admin can view any payment.

---

## GET /bookings/:bookingId/payment

Authenticated.

Returns the payment associated with a booking.

---

## POST /payments/:id/refund

ADMIN only.

Refunds a `PAID` payment only when the booking is eligible for refund under BR-031, such as a cancelled paid booking. The endpoint must reject refunds for payments that are not `PAID` and must prevent a second refund. Refund processing updates the payment status to `REFUNDED` and records `refundedAt` and the optional `refundReason`. This is a simulated refund; no external payment provider is contacted.

### Request

```
{
  "reason": "Booking cancelled by customer"
}
```

`reason` is optional and stored as `refundReason`.

### Response

```
{
  "success": true,
  "message": "Payment refunded successfully.",
  "data": {
    "id": "PAYMENT_ID",
    "bookingId": "BOOKING_ID",
    "amount": 9000,
    "method": "UPI",
    "status": "REFUNDED",
    "refundedAt": "2026-10-23T10:00:00.000Z",
    "refundReason": "Booking cancelled by customer"
  }
}
```

---

# 8. Returns

## POST /returns

ADMIN only.

The admin processes the physical return on behalf of the customer. This endpoint creates the return record and performs the associated booking transition: `PICKED_UP -> RETURNED` or `OVERDUE -> RETURNED`. It must reject bookings that are not eligible for return and must prevent duplicate return records. `actualReturnDate` must be a valid `YYYY-MM-DD` date and cannot precede the booking's `rentalStartDate`. The backend calculates `lateDays = max(0, actualReturnDate - expectedReturnDate)` in UTC calendar days and calculates `fine = lateDays × FINE_PER_DAY`. The client cannot submit `lateDays` or `fine`.

### Request

```
{
  "bookingId": "BOOKING_ID",
  "actualReturnDate": "2026-10-24",
  "condition": "GOOD"
}
```

### Response 201

```json
{
  "success": true,
  "message": "Return processed successfully.",
  "data": {
    "id": "RETURN_ID",
    "bookingId": "BOOKING_ID",
    "expectedReturnDate": "2026-10-22T00:00:00.000Z",
    "actualReturnDate": "2026-10-24T00:00:00.000Z",
    "lateDays": 2,
    "fine": 200,
    "condition": "GOOD",
    "status": "LATE"
  }
}
```

---

## GET /returns

Authenticated.

Customer receives their own return records.

Admin may access all returns through admin functionality.

---

## GET /returns/:id

Authenticated.

Customer can access their own return.

Admin can access any return.

---

## POST /returns/:id/settle

ADMIN only.

Records administrative confirmation that the late fine has been collected and calculates the security-deposit amount to return (see BR-032). This is a college-demo bookkeeping action, not an actual payment-gateway transaction. The backend computes `fine` and `depositRefunded`; the client submits neither. `damageCharge` must be a non-negative number no greater than the booking's security deposit. Settlement is allowed only once for a return record; repeat attempts return `SETTLEMENT_ALREADY_COMPLETED`.

### Request

```
{
  "damageCharge": 0
}
```

Settling a return records the fine as collected (`finePaid` is set to `true` by the backend) and computes `depositRefunded = max(0, booking.securityDeposit - damageCharge)`. Fine collection is tracked separately and is not deducted from the deposit by default. Only `damageCharge` is submitted. After successful settlement, the booking transitions from `RETURNED` to `COMPLETED`.

### Response

```
{
  "success": true,
  "message": "Return settled successfully.",
  "data": {
    "id": "RETURN_ID",
    "bookingId": "BOOKING_ID",
    "lateDays": 2,
    "fine": 200,
    "depositRefunded": 3000,
    "finePaid": true,
    "settled": true,
    "settledAt": "2026-10-24T10:00:00.000Z"
  }
}
```

---

# 9. Notifications

## GET /notifications

Authenticated.

Returns notifications belonging to the current customer.

Optional (default false):

```
unreadOnly=true

```

### Response

```
{
  "success": true,
  "data": [
    {
      "id": "NOTIFICATION_ID",
      "bookingId": "BOOKING_ID",
      "type": "RETURN_3_DAYS",
      "message": "Your clothing rental is due in 3 days.",
      "scheduledFor": "2026-10-17T09:00:00.000Z",
      "isRead": false
    }
  ]
}
```

---

## PUT /notifications/:id/read

Authenticated.

Marks the customer's notification as read.

### Response

```
{
  "success": true,
  "message": "Notification marked as read."
}
```

---

# 10. Admin

All endpoints in this section require:

```
JWT
+
ADMIN role

```

## GET /admin/dashboard

Returns dashboard metrics.

### Response

```
{
  "success": true,
  "data": {
    "totalCustomers": 120,
    "totalClothingItems": 85,
    "availableItems": 62,
    "activeRentals": 18,
    "pendingBookings": 7,
    "overdueRentals": 3,
    "monthlyRevenue": 125000
  }
}
```

`availableItems` counts distinct clothing products that are currently available, not the sum of their physical units.

---

## GET /admin/customers

Returns customer list.

Query:

```
search
page
limit

```

---

## GET /admin/bookings

Returns all bookings.

Query:

```
status
startDate
endDate
page
limit

```

---

## GET /admin/payments

Returns all payment records.

Query:

```
status
page
limit

```

---

## GET /admin/returns

Returns all return records.

Query:

```
status
page
limit

```

---

## GET /admin/reports

Returns basic analytics.

Possible data:

```
monthlyBookings
monthlyRevenue
mostRentedClothing
categoryWiseRentals

```

---

# 11. Health Check

## GET /health

Public.

### Response

```
{
  "success": true,
  "message": "Perfect Rent & Remind API is running."
}
```
