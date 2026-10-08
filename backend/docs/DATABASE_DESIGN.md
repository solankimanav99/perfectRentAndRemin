# Perfect Rent & Remind – Database Design

## 1. Database

Database: **MongoDB**

ODM: **Mongoose**

Suggested database name:

```text
perfect_rent
```

---

## 2. Collections

Core collections:

```text
users
categories
clothes
bookings
payments
returns
notifications
```

---

# 3. Users Collection

Collection:

```text
users
```

### Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| _id | ObjectId | Auto | MongoDB ID |
| name | String | Yes | Customer/admin name |
| email | String | Yes | Unique |
| password | String | Yes | bcrypt hash only |
| phone | String | No | Contact number |
| role | String | Yes | CUSTOMER or ADMIN |
| createdAt | Date | Auto | Creation time |
| updatedAt | Date | Auto | Last update |

### Role enum

```text
CUSTOMER
ADMIN
```

### Rules

- Email must be unique.
- Password must never be stored in plain text.
- Password hash should be created using bcryptjs.
- Role defaults to CUSTOMER.
- Admin creation should not be exposed as an unrestricted public registration operation.
- The first ADMIN account is created by the seed script (`npm run seed:admin`), not through the API.

---

# 4. Categories Collection

Collection:

```text
categories
```

### Fields

| Field | Type | Required |
|---|---|---:|
| _id | ObjectId | Auto |
| name | String | Yes |
| description | String | No |
| createdAt | Date | Auto |
| updatedAt | Date | Auto |

### Suggested categories

```text
Sherwani
Suit
Blazer
Lehenga
Saree
Party Wear
Formal Wear
Traditional Wear
```

---

# 5. Clothes Collection

Collection:

```text
clothes
```

### Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| _id | ObjectId | Auto | Clothing ID |
| name | String | Yes | Clothing name |
| categoryId | ObjectId | Yes | References categories |
| description | String | Yes | Details |
| size | String | Yes | e.g. S, M, L, XL |
| color | String | Yes | Primary color |
| rentalPrice | Number | Yes | Price per rental day per quantity unit |
| securityDeposit | Number | Yes | Deposit for the booking |
| quantity | Number | Yes | Total physical quantity |
| image | String | No | Image URL/path |
| condition | String | Yes | Current general condition |
| availabilityStatus | String | Yes | AVAILABLE, UNAVAILABLE, MAINTENANCE |
| createdAt | Date | Auto |
| updatedAt | Date | Auto |

### Important note about availableQuantity

`availableQuantity` should preferably be calculated from total quantity and active
date-range bookings rather than treated as a permanently stored number.

For the list/details API, the backend may return a calculated:

```text
availableQuantity
```

based on the requested dates.

If no dates are supplied, the API may return current/non-reserved availability.

---

# 6. Bookings Collection

Collection:

```text
bookings
```

### Fields

| Field | Type | Required |
|---|---|---:|
| _id | ObjectId | Auto |
| customerId | ObjectId | Yes |
| clothingId | ObjectId | Yes |
| rentalStartDate | Date | Yes |
| returnDate | Date | Yes |
| quantity | Number | Yes |
| rentalDuration | Number | Yes |
| rentalAmount | Number | Yes |
| securityDeposit | Number | Yes |
| totalAmount | Number | Yes |
| status | String | Yes |
| createdAt | Date | Auto |
| updatedAt | Date | Auto |

### Booking status enum

```text
PENDING
CONFIRMED
PICKED_UP
RETURNED
COMPLETED
CANCELLED
OVERDUE
```

---

# 7. Payments Collection

Collection:

```text
payments
```

### Fields

| Field | Type | Required |
|---|---|---:|
| _id | ObjectId | Auto |
| bookingId | ObjectId | Yes |
| customerId | ObjectId | Yes |
| amount | Number | Yes |
| method | String | Yes |
| status | String | Yes |
| transactionReference | String | No |
| paidAt | Date | No |
| refundedAt | Date | No |
| refundReason | String | No |
| createdAt | Date | Auto |
| updatedAt | Date | Auto |

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

This is a simulated payment system for the college project.

---

# 8. Returns Collection

Collection:

```text
returns
```

### Fields

| Field | Type | Required |
|---|---|---:|
| _id | ObjectId | Auto |
| bookingId | ObjectId | Yes |
| clothingId | ObjectId | Yes |
| customerId | ObjectId | Yes |
| expectedReturnDate | Date | Yes |
| actualReturnDate | Date | Yes |
| lateDays | Number | Yes |
| fine | Number | Yes |
| condition | String | Yes |
| status | String | Yes |
| damageCharge | Number | Yes | Amount deducted for damage (default 0) |
| depositRefunded | Number | Yes | Deposit returned to customer (default 0) |
| finePaid | Boolean | Yes | Whether the late fine has been collected (default false) |
| settled | Boolean | Yes | Whether deposit + fine settlement is complete (default false) |
| settledAt | Date | No | When settlement completed |
| createdAt | Date | Auto |
| updatedAt | Date | Auto |

### Return statuses

```text
PENDING
RETURNED
LATE
DAMAGED
```

### Return condition values

```text
EXCELLENT
GOOD
FAIR
DAMAGED
```

---

# 9. Notifications Collection

Collection:

```text
notifications
```

### Fields

| Field | Type | Required |
|---|---|---:|
| _id | ObjectId | Auto |
| customerId | ObjectId | Yes |
| bookingId | ObjectId | No |
| type | String | Yes |
| message | String | Yes |
| scheduledFor | Date | Yes |
| isRead | Boolean | Yes |
| createdAt | Date | Auto |
| updatedAt | Date | Auto |

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

# 10. Relationships

```text
User
 |
 +----< Booking >---- Clothing
 |          |
 |          +-------- Payment
 |          |
 |          +-------- Return
 |
 +----< Notification

Category
 |
 +----< Clothing
```

More explicitly:

```text
users._id
    |
    +--> bookings.customerId
    +--> payments.customerId
    +--> returns.customerId
    +--> notifications.customerId

categories._id
    |
    +--> clothes.categoryId

clothes._id
    |
    +--> bookings.clothingId
    +--> returns.clothingId

bookings._id
    |
    +--> payments.bookingId
    +--> returns.bookingId
    +--> notifications.bookingId
```

---

# 11. Index Recommendations

Important indexes:

```text
users.email                 UNIQUE
categories.name             UNIQUE
bookings.customerId
bookings.clothingId
bookings.rentalStartDate
bookings.returnDate
bookings.status
payments.bookingId
payments.status
returns.bookingId
returns.status
notifications.customerId
notifications.isRead
notifications.scheduledFor
```

Recommended compound index:

```text
clothes (name, size, color)
```

---

# 12. Data Integrity Rules

- Referenced customer must exist.
- Referenced clothing must exist.
- Referenced category must exist.
- Booking quantity must be positive.
- Dates must be valid.
- Return date must be after rental start date.
- Booking amount must be calculated by backend.
- Fine must be calculated by backend.
- Clients must not be trusted to determine availability or final price.
