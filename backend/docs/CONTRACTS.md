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

---

# 6. Booking Contract
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

---

# 7. Payment Contract
```json
{
  "id": "PAYMENT_ID",
  "bookingId": "BOOKING_ID",
  "customerId": "USER_ID",
  "amount": 9000,
  "method": "UPI",
  "status": "PAID",
  "transactionReference": "SIM-123456",
  "paidAt": "2026-10-08T10:10:00.000Z"
}
```

---

# 8. Return Contract
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
  "status": "LATE"
}
```

---

# 9. Notification Contract
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
