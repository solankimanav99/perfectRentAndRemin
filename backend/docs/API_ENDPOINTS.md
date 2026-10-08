# Perfect Rent & Remind – API Endpoints

Base URL:

```text
http://localhost:5000/api
```

Authentication:

```text
Authorization: Bearer <JWT_TOKEN>
```

---

# 1. Authentication

## POST /auth/register

Public.

Creates a CUSTOMER account.

### Request

```json
{
  "name": "Alison Solanki",
  "email": "alison@example.com",
  "password": "password123",
  "phone": "9876543210"
}
```

### Response 201

```json
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

```json
{
  "email": "alison@example.com",
  "password": "password123"
}
```

### Response 200

```json
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

```json
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

For JWT authentication, logout can be handled client-side by removing the token.
The endpoint may still exist for a consistent frontend workflow.

### Response

```json
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

```json
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

## PUT /users/profile

Authenticated.

### Request

```json
{
  "name": "Updated Name",
  "phone": "9999999999"
}
```

### Response

```json
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

```json
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

ADMIN only.

### Request

```json
{
  "name": "Sherwani",
  "description": "Traditional wedding wear"
}
```

---

## PUT /categories/:id

ADMIN only.

### Request

```json
{
  "name": "Wedding Sherwani",
  "description": "Updated description"
}
```

---

## DELETE /categories/:id

ADMIN only.

Category deletion should be rejected if doing so would leave clothing records with
an invalid category reference, unless the implementation explicitly supports
reassignment.

---

# 4. Clothing

## GET /clothing

Public.

Supports optional query parameters:

```text
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

Example:

```text
GET /api/clothing?category=Sherwani&size=L&startDate=2026-10-20&endDate=2026-10-22
```

### Response

```json
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

```json
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

ADMIN only.

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

---

## PUT /clothing/:id

ADMIN only.

Same fields as creation, as applicable.

---

## DELETE /clothing/:id

ADMIN only.

Prefer preventing deletion when active bookings depend on the item. A soft-delete
or MAINTENANCE/UNAVAILABLE state may be safer for real rental data.

---

# 5. Availability

## GET /clothing/:id/availability

Public.

Query:

```text
startDate
endDate
quantity
```

Example:

```text
GET /api/clothing/CLOTHING_ID/availability?startDate=2026-10-20&endDate=2026-10-22&quantity=2
```

### Response

```json
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

```json
{
  "clothingId": "CLOTHING_ID",
  "rentalStartDate": "2026-10-20",
  "returnDate": "2026-10-22",
  "quantity": 2
}
```

### Response 201

```json
{
  "success": true,
  "message": "Booking created successfully.",
  "data": {
    "id": "BOOKING_ID",
    "clothingId": "CLOTHING_ID",
    "rentalStartDate": "2026-10-20",
    "returnDate": "2026-10-22",
    "quantity": 2,
    "rentalDuration": 2,
    "rentalAmount": 6000,
    "securityDeposit": 3000,
    "totalAmount": 9000,
    "status": "PENDING"
  }
}
```

The exact deposit calculation must be kept consistent with the implementation.
The backend is authoritative.

---

## GET /bookings

Authenticated.

Customer receives their own bookings.

Admin may receive all bookings through the dedicated admin endpoint.

Optional filters:

```text
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

Authenticated.

Customer may cancel an eligible booking belonging to them.

### Response

```json
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

Used for administrative status transitions such as:

```text
PENDING -> CONFIRMED
CONFIRMED -> PICKED_UP
PICKED_UP -> RETURNED
```

### Request

```json
{
  "status": "CONFIRMED"
}
```

---

# 7. Payments

## POST /payments

Authenticated.

Creates a simulated payment for a booking.

### Request

```json
{
  "bookingId": "BOOKING_ID",
  "method": "UPI"
}
```

### Response

```json
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

## GET /payments/:id

Authenticated.

Customer can view payment belonging to their booking.

Admin can view any payment.

---

## GET /bookings/:bookingId/payment

Authenticated.

Returns the payment associated with a booking.

---

# 8. Returns

## POST /returns

Authenticated.

For the initial project, ADMIN may process the physical return.

### Request

```json
{
  "bookingId": "BOOKING_ID",
  "actualReturnDate": "2026-10-22",
  "condition": "GOOD"
}
```

### Response

```json
{
  "success": true,
  "message": "Return processed successfully.",
  "data": {
    "id": "RETURN_ID",
    "bookingId": "BOOKING_ID",
    "expectedReturnDate": "2026-10-20",
    "actualReturnDate": "2026-10-22",
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

# 9. Notifications

## GET /notifications

Authenticated.

Returns notifications belonging to the current customer.

Optional:

```text
unreadOnly=true
```

### Response

```json
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

```json
{
  "success": true,
  "message": "Notification marked as read."
}
```

---

# 10. Admin

All endpoints in this section require:

```text
JWT
+
ADMIN role
```

## GET /admin/dashboard

Returns dashboard metrics.

### Response

```json
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

---

## GET /admin/customers

Returns customer list.

Query:

```text
search
page
limit
```

---

## GET /admin/bookings

Returns all bookings.

Query:

```text
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

```text
status
page
limit
```

---

## GET /admin/returns

Returns all return records.

Query:

```text
status
page
limit
```

---

## GET /admin/reports

Returns basic analytics.

Possible data:

```text
monthlyBookings
monthlyRevenue
mostRentedClothing
categoryWiseRentals
```

---

# 11. Chatbot

## POST /chatbot

Public.

Rule-based support chatbot.

### Request

```json
{
  "message": "How is the late fine calculated?"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "reply": "The late fine is calculated based on the number of late days and the applicable fine per day."
  }
}
```

The chatbot cannot modify bookings, payments, inventory or user accounts.

---

# 12. Health Check

## GET /health

Public.

### Response

```json
{
  "success": true,
  "message": "Perfect Rent & Remind API is running."
}
```
