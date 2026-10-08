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
Collection: `users`

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

---

# 4. Categories Collection
Collection: `categories`

### Fields
| Field | Type | Required |
|---|---|---:|
| _id | ObjectId | Auto |
| name | String | Yes |
| description | String | No |
| createdAt | Date | Auto |
| updatedAt | Date | Auto |

---

# 5. Clothes Collection
Collection: `clothes`

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

---

# 6. Bookings Collection
Collection: `bookings`

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

---

# 7. Payments Collection
Collection: `payments`

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
| createdAt | Date | Auto |
| updatedAt | Date | Auto |

---

# 8. Returns Collection
Collection: `returns`

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
| createdAt | Date | Auto |
| updatedAt | Date | Auto |

---

# 9. Notifications Collection
Collection: `notifications`

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

---

# 10. Relationships
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
returns.bookingId
notifications.customerId
notifications.isRead
```
