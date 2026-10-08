# Database Design 🗄️

## Database: MongoDB

**Database Name:** `perfect_rent`

MongoDB is a NoSQL document database. Data is stored as JSON-like documents in **collections** (similar to tables in SQL). We use **Mongoose** as the ODM (Object Data Modeling) library to define schemas and interact with MongoDB from Node.js.

---

## Collections Overview

| Collection | Purpose |
|------------|---------|
| `users` | Customer and admin accounts |
| `categories` | Clothing categories (Sherwani, Suit, etc.) |
| `clothes` | Clothing inventory items |
| `bookings` | Customer rental bookings |
| `payments` | Payment records for bookings |
| `returns` | Return records with fine calculation |
| `notifications` | Reminder notifications for customers |

---

## Relationships Diagram

```
users (1) ──────→ (N) bookings
clothes (1) ────→ (N) bookings
categories (1) → (N) clothes
bookings (1) ───→ (1) payments
bookings (1) ───→ (1) returns
users (1) ──────→ (N) notifications
bookings (1) ───→ (N) notifications
```

---

## Collection 1: users

**Purpose:** Stores customer and admin accounts.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | MongoDB auto-generated ID |
| `name` | String | Yes | Full name |
| `email` | String | Yes (Unique) | Email address |
| `password` | String | Yes | Hashed password (bcrypt) |
| `phone` | String | No | Phone number |
| `address` | String | No | Customer address |
| `role` | String | Yes | `"customer"` or `"admin"` (default: `"customer"`) |
| `profilePhoto` | String | No | Profile image URL |
| `createdAt` | Date | Auto | Account creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

**Indexes:** `email` (unique)

---

## Collection 2: categories

**Purpose:** Clothing categories for organizing inventory.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | MongoDB auto-generated ID |
| `name` | String | Yes (Unique) | Category name |
| `description` | String | No | Category description |
| `image` | String | No | Category image URL |
| `isActive` | Boolean | Yes | Whether category is active (default: `true`) |
| `createdAt` | Date | Auto | Creation timestamp |

**Default Categories:** Sherwani, Suit, Blazer, Lehenga, Saree, Party Wear, Formal Wear, Traditional Wear

---

## Collection 3: clothes

**Purpose:** Clothing inventory items available for rental.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | MongoDB auto-generated ID |
| `name` | String | Yes | Clothing name |
| `category` | ObjectId | Yes | Reference → `categories._id` |
| `description` | String | No | Detailed description |
| `size` | String | Yes | Size (S, M, L, XL, XXL, Free Size) |
| `color` | String | Yes | Color of the clothing |
| `rentalPrice` | Number | Yes | Rental price per day (₹) |
| `securityDeposit` | Number | Yes | Security deposit amount (₹) |
| `totalQuantity` | Number | Yes | Total pieces in inventory |
| `availableQuantity` | Number | Yes | Currently available pieces |
| `images` | [String] | No | Array of image URLs |
| `condition` | String | Yes | `"new"`, `"good"`, `"fair"` (default: `"good"`) |
| `isAvailable` | Boolean | Yes | Overall availability flag (default: `true`) |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

**Indexes:** `category`, `isAvailable`

---

## Collection 4: bookings

**Purpose:** Stores all rental bookings made by customers.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | MongoDB auto-generated ID |
| `bookingId` | String | Auto | Human-readable ID (e.g., `BK-20261008-001`) |
| `customer` | ObjectId | Yes | Reference → `users._id` |
| `clothing` | ObjectId | Yes | Reference → `clothes._id` |
| `quantity` | Number | Yes | Number of pieces booked |
| `rentalStartDate` | Date | Yes | Rental start date |
| `returnDate` | Date | Yes | Expected return date |
| `rentalDays` | Number | Auto | Calculated: returnDate - rentalStartDate |
| `rentalAmount` | Number | Auto | Calculated: rentalPrice × rentalDays × quantity |
| `securityDeposit` | Number | Auto | From clothing item |
| `totalAmount` | Number | Auto | rentalAmount + securityDeposit |
| `status` | String | Yes | Booking status (see below) |
| `createdAt` | Date | Auto | Booking creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

**Booking Statuses:**

| Status | Meaning |
|--------|---------|
| `pending` | Booking created, awaiting confirmation |
| `confirmed` | Admin confirmed the booking |
| `picked_up` | Customer picked up the clothing |
| `returned` | Customer returned the clothing |
| `completed` | Booking fully completed (return processed) |
| `cancelled` | Booking was cancelled |
| `overdue` | Return date has passed, item not returned |

**Indexes:** `customer`, `clothing`, `status`, `returnDate`

---

## Collection 5: payments

**Purpose:** Payment records linked to bookings.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | MongoDB auto-generated ID |
| `booking` | ObjectId | Yes | Reference → `bookings._id` |
| `customer` | ObjectId | Yes | Reference → `users._id` |
| `amount` | Number | Yes | Payment amount (₹) |
| `method` | String | Yes | `"upi"`, `"card"`, `"cash"` |
| `status` | String | Yes | `"pending"`, `"paid"`, `"failed"`, `"refunded"` |
| `transactionId` | String | No | Simulated transaction ID |
| `paidAt` | Date | No | When payment was completed |
| `createdAt` | Date | Auto | Record creation timestamp |

**Indexes:** `booking`, `customer`, `status`

---

## Collection 6: returns

**Purpose:** Tracks clothing returns and calculates late fines.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | MongoDB auto-generated ID |
| `booking` | ObjectId | Yes | Reference → `bookings._id` |
| `customer` | ObjectId | Yes | Reference → `users._id` |
| `expectedReturnDate` | Date | Yes | Original return date from booking |
| `actualReturnDate` | Date | No | When item was actually returned |
| `lateDays` | Number | Default: 0 | Number of days late |
| `finePerDay` | Number | Yes | Fine rate per day (default: ₹100) |
| `totalFine` | Number | Default: 0 | Calculated: lateDays × finePerDay |
| `clothingCondition` | String | No | `"good"`, `"damaged"`, `"lost"` |
| `status` | String | Yes | `"pending"`, `"returned"`, `"overdue"` |
| `notes` | String | No | Admin notes about the return |
| `createdAt` | Date | Auto | Record creation timestamp |

**Indexes:** `booking`, `status`, `expectedReturnDate`

**Fine Calculation Example:**
```
Expected Return: 20 October 2026
Actual Return:   22 October 2026
Late Days:       2
Fine Per Day:    ₹100
Total Fine:      ₹200
```

---

## Collection 7: notifications

**Purpose:** In-app reminder notifications for customers.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | MongoDB auto-generated ID |
| `customer` | ObjectId | Yes | Reference → `users._id` |
| `booking` | ObjectId | Yes | Reference → `bookings._id` |
| `type` | String | Yes | `"reminder_3day"`, `"reminder_1day"`, `"reminder_due"`, `"overdue"` |
| `message` | String | Yes | Notification message text |
| `isRead` | Boolean | Yes | Read status (default: `false`) |
| `createdAt` | Date | Auto | When notification was generated |

**Reminder Messages:**

| Type | Message |
|------|---------|
| `reminder_3day` | "Your clothing rental is due in 3 days." |
| `reminder_1day` | "Your clothing rental is due tomorrow." |
| `reminder_due` | "Your clothing rental is due today." |
| `overdue` | "Your rental is overdue. Late charges may apply." |

**Indexes:** `customer`, `booking`, `isRead`

---

## Important Business Rules

### 1. No Double Booking
Before creating a booking, the system must check:
- How many pieces of the clothing are already booked for overlapping dates?
- Is the `availableQuantity` sufficient?
- If not → reject the booking.

### 2. Auto-Calculate Rental Amount
```
rentalDays = returnDate - rentalStartDate (in days)
rentalAmount = rentalPrice × rentalDays × quantity
totalAmount = rentalAmount + securityDeposit
```

### 3. Auto-Calculate Late Fine
```
lateDays = actualReturnDate - expectedReturnDate (in days)
totalFine = lateDays × finePerDay
```
Fine is only calculated if `lateDays > 0`.

### 4. Password Security
- Passwords are **never stored in plain text**.
- Always hashed using **bcryptjs** before saving.
- Never returned in API responses.

---

## Design Decisions

| Decision | Reason |
|----------|--------|
| Separate `payments` collection | Keeps payment data clean; one payment per booking |
| Separate `returns` collection | Return processing has its own logic (fines, condition) |
| `notifications` collection | Easy to query unread notifications per customer |
| `role` field in `users` | Single collection for both customers and admins |
| `bookingId` as human-readable | Easier for customers and admins than ObjectId |
| `availableQuantity` on clothing | Quick availability check without querying bookings |
