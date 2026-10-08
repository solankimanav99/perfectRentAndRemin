# Perfect Rent & Remind – Error Codes

All backend errors should use a predictable structure.

## Common Response

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

## 1. Authentication Errors

| Code | Meaning |
|---|---|
| AUTH_EMAIL_EXISTS | Email is already registered |
| AUTH_INVALID_CREDENTIALS | Email/password combination is invalid |
| AUTH_TOKEN_MISSING | Protected endpoint requires a token |
| AUTH_TOKEN_INVALID | JWT is invalid or expired |
| AUTH_ACCOUNT_NOT_FOUND | User account does not exist |

---

## 2. Authorization Errors

| Code | Meaning |
|---|---|
| UNAUTHORIZED | User is not authenticated |
| FORBIDDEN | Authenticated user does not have permission |

---

## 3. Validation Errors

| Code | Meaning |
|---|---|
| VALIDATION_ERROR | General request validation failure |
| INVALID_ID | Invalid MongoDB ObjectId |
| INVALID_DATE_RANGE | Rental dates are invalid |
| INVALID_QUANTITY | Quantity must be positive |
| REQUIRED_FIELD | Required field is missing |

---

## 4. Clothing Errors

| Code | Meaning |
|---|---|
| CLOTHING_NOT_FOUND | Clothing item does not exist |
| CLOTHING_UNAVAILABLE | Clothing cannot currently be booked |
| CATEGORY_NOT_FOUND | Category does not exist |
| CATEGORY_EXISTS | Category already exists |

---

## 5. Booking Errors

| Code | Meaning |
|---|---|
| BOOKING_NOT_FOUND | Booking does not exist |
| BOOKING_OVERLAP | Requested inventory is unavailable for selected dates |
| BOOKING_QUANTITY_INVALID | Requested quantity exceeds allowed quantity |
| BOOKING_DATE_INVALID | Invalid rental dates |
| BOOKING_NOT_CANCELLABLE | Booking cannot be cancelled |
| BOOKING_INVALID_STATUS | Invalid booking status transition |
| BOOKING_ALREADY_RETURNED | Booking has already been returned |

---

## 6. Payment Errors

| Code | Meaning |
|---|---|
| PAYMENT_NOT_FOUND | Payment does not exist |
| PAYMENT_FAILED | Simulated payment failed |
| PAYMENT_ALREADY_PROCESSED | Payment cannot be processed again |
| PAYMENT_INVALID_METHOD | Payment method is not supported |

---

## 7. Return Errors

| Code | Meaning |
|---|---|
| RETURN_NOT_FOUND | Return record does not exist |
| RETURN_ALREADY_COMPLETED | Return has already been processed |
| RETURN_INVALID_BOOKING | Booking cannot be returned |
| RETURN_INVALID_DATE | Invalid actual return date |

---

## 8. Server Errors

| Code | Meaning |
|---|---|
| INTERNAL_SERVER_ERROR | Unexpected server error |
| DATABASE_ERROR | Database operation failed |

---

## HTTP Status Mapping

| HTTP | Typical Use |
|---:|---|
| 200 | Successful GET/update |
| 201 | Resource created |
| 400 | Invalid request |
| 401 | Missing/invalid authentication |
| 403 | Insufficient permission |
| 404 | Resource not found |
| 409 | Conflict such as overlapping booking |
| 500 | Unexpected server/database error |
