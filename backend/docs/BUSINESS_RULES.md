# Perfect Rent & Remind – Business Rules

This document defines rules that the backend must enforce regardless of what the
frontend sends.

---

## BR-001 – Authentication

Customers must authenticate before accessing protected customer operations.

Admin operations require:

```text
Valid JWT
+
role = ADMIN
```

---

## BR-002 – Customer Registration

Public registration creates a CUSTOMER account.

A client must not be able to register itself as ADMIN by sending:

```json
{
  "role": "ADMIN"
}
```

The backend must ignore/reject unauthorized role assignment.

---

## BR-003 – Password Security

Passwords must:

- Never be stored as plain text.
- Be hashed with bcryptjs.
- Never be returned in API responses.

---

## BR-004 – Clothing Quantity

```text
quantity >= 1
```

A clothing item with quantity 0 cannot be newly booked.

---

## BR-005 – Valid Rental Dates

Required:

```text
rentalStartDate < returnDate
```

Past rental start dates must not be accepted for new bookings.

---

## BR-006 – Rental Duration

`rentalDuration` is the number of whole days between the start and return dates,
exclusive of the start day:

```text
rentalDuration = (returnDate - rentalStartDate) / 86,400,000 ms
```

Example: 2026-10-20 to 2026-10-22 → `rentalDuration = 2`.

`rentalDuration` must be an integer `>= 1`. A zero or negative duration is
invalid. This formula must be implemented in one place and reused everywhere.

---

## BR-007 – Rental Amount

The backend calculates the rental amount.

Conceptually:

```text
rentalAmount =
rentalPrice × quantity × rentalDuration
```

The frontend may display an estimate, but the backend is authoritative.

---

## BR-008 – Security Deposit

The backend reads the deposit from the clothing record and applies it to the
booking as a flat amount, independent of quantity:

```text
securityDeposit = clothing.securityDeposit
```

The deposit is not multiplied by the booking quantity. The client never submits
the deposit (BR-025).

---

## BR-009 – Total Booking Amount

```text
totalAmount =
rentalAmount + securityDeposit
```

The client must not be trusted to submit the final amount.

---

## BR-010 – Availability

Availability depends on:

```text
clothing total quantity
-
quantity already reserved for overlapping active bookings
```

For a requested quantity `Q`:

```text
availableQuantity >= Q
```

must be true before a booking can be confirmed.

Only bookings in a reservable status (see BR-030) count toward the reserved
quantity.

---

## BR-011 – Overlapping Booking Rule

Two booking periods overlap when:

```text
existingStart < requestedEnd
AND
existingEnd > requestedStart
```

Only bookings in a reservable status (see BR-030) should reserve inventory.

Cancelled, returned and completed bookings must not reserve inventory.

---

## BR-012 – Double Booking Prevention

If the requested quantity is not available for the requested date range:

```text
booking must be rejected
```

The backend must return `BOOKING_OVERLAP` (see ERROR_CODES.md).

Distinguish the two availability failures:

- `CLOTHING_UNAVAILABLE` — the item itself cannot be booked at all:
  `availabilityStatus` is not `AVAILABLE`, `quantity` is 0, or the item is under
  `MAINTENANCE`.
- `BOOKING_OVERLAP` — the item is bookable in general, but fewer than the
  requested quantity are free for the requested date range.

---

## BR-013 – Booking Status

Allowed statuses:

```text
PENDING
CONFIRMED
PICKED_UP
RETURNED
COMPLETED
CANCELLED
OVERDUE
```

The backend must validate status transitions against this map:

```text
PENDING    -> CONFIRMED, CANCELLED
CONFIRMED  -> PICKED_UP, CANCELLED
PICKED_UP  -> RETURNED, OVERDUE
OVERDUE    -> RETURNED
RETURNED   -> COMPLETED
COMPLETED  -> (terminal)
CANCELLED  -> (terminal)
```

Any transition not listed must be rejected with `BOOKING_INVALID_STATUS`.

---

## BR-014 – Booking Cancellation

A customer may cancel only a booking that belongs to that customer and is still
eligible for cancellation.

A booking that has already been returned/completed should not be cancellable.

---

## BR-015 – Payment

Payment is simulated for the college version. A simulated payment attempt
defaults to success: `POST /payments` returns status `PAID` unless a failure is
explicitly simulated for testing. `FAILED` is reserved for that test path.

Allowed methods:

```text
UPI
CARD
CASH_ON_PICKUP
```

Allowed statuses:

```text
PENDING
PAID
FAILED
REFUNDED
```

---

## BR-016 – Pickup

A booking should only become:

```text
PICKED_UP
```

after it is confirmed and eligible for pickup.

---

## BR-017 – Return

A return belongs to exactly one booking.

The return records:

- Expected return date
- Actual return date
- Late days
- Fine
- Condition
- Status

---

## BR-018 – Late Days

Conceptually:

```text
lateDays =
max(0, actualReturnDate - expectedReturnDate)
```

If the item is returned on time:

```text
lateDays = 0
fine = 0
```

---

## BR-019 – Late Fine

Default college-project fine rate:

```text
₹100 per late day
```

Therefore:

```text
fine = lateDays × FINE_PER_DAY
```

The fine rate is read from the `FINE_PER_DAY` environment variable (default
100) and exposed through `src/utils/constants.js`. It must never be hardcoded in
more than one place.

---

## BR-020 – Overdue Status

If the current date is after the expected return date and the item has not been
returned:

```text
booking.status = OVERDUE
```

---

## BR-021 – Reminders

The system should support:

```text
3 days before return
1 day before return
due date
after due date
```

Example messages:

```text
Your clothing rental is due in 3 days.

Your clothing rental is due tomorrow.

Your clothing rental is due today.

Your rental is overdue. Late charges may apply.
```

---

## BR-022 – Notification Ownership

Customers may only view their own notifications.

Admins may view notifications through appropriate admin functionality if required.

---

## BR-023 – Admin Inventory Management

Only ADMIN users can:

- Add clothing
- Edit clothing
- Delete clothing
- Change inventory
- Manage categories

---

## BR-024 – Customer Permissions

Customers can:

- Browse clothing
- Search/filter
- View details
- Check availability
- Create bookings
- View their bookings
- View their payments (GET /payments)
- View their returns
- View their notifications

Customers cannot:

- Modify inventory
- Delete clothing
- Manage other customers
- Access admin dashboard data

---

## BR-025 – Price Authority

The backend is authoritative for:

```text
rentalPrice
securityDeposit
rentalAmount
totalAmount
fine
```

Frontend-submitted calculated values must not override backend values.

---

## BR-026 – Input Validation

Backend must validate:

- Email
- Password
- Required strings
- Object IDs
- Dates
- Quantity
- Price fields
- Status values

---

## BR-027 – Error Consistency

All API errors must follow the common error response defined in
CONTRACTS.md.

---

## BR-028 – Chatbot

The initial chatbot is rule-based.

It can answer:

- How do I rent clothes?
- How do I book an outfit?
- What is the security deposit?
- What is the return policy?
- How is the late fine calculated?
- Can I cancel my booking?
- How can I contact support?

The chatbot must not be allowed to modify bookings or inventory.

---

## BR-029 – Scope Control

The initial implementation does not require:

- Real payment gateway
- Email/SMS/WhatsApp integration
- AI recommendation engine
- Wishlist
- Reviews
- QR workflow
- Automatic expiry of stale PENDING bookings

These are optional future extensions.

---

## BR-030 – Reservable Booking Statuses

A booking reserves inventory only while its status is one of:

```text
PENDING
CONFIRMED
PICKED_UP
OVERDUE
```

Bookings with status `CANCELLED`, `RETURNED` or `COMPLETED` must never reserve
inventory.

A `PENDING` booking reserves inventory from creation so that two customers
cannot hold the same item for the same dates. Automatic expiry of stale
`PENDING` bookings is deferred and not part of the initial version (see BR-029).

---

## BR-031 – Refunds

A booking cancelled after a `PAID` payment must be refunded through
`POST /payments/:id/refund` (ADMIN only).

A refund sets `payment.status = REFUNDED`, records `refundedAt`, and does not
change the original `amount`. Refunds are simulated.

A payment already in status `REFUNDED` must not be refunded again
(`PAYMENT_ALREADY_PROCESSED`).

---

## BR-032 – Fine and Deposit Settlement

When a return is processed, the backend records:

- `fine` — the late fine owed (`lateDays × FINE_PER_DAY`)
- `depositRefunded` — the security deposit returned to the customer

Settlement (`POST /returns/:id/settle`, ADMIN only) marks `finePaid` and
`settled`, and records `settledAt`.

The backend is authoritative for both the fine and the deposit amount; the
client must not submit them.

---

## BR-033 – Reminders and Overdue Job

A scheduled job (`node-cron`, expression from `REMINDER_CRON`) runs daily and:

- generates `RETURN_3_DAYS`, `RETURN_1_DAY` and `RETURN_DUE_TODAY` notifications
  for eligible bookings
- generates `RETURN_OVERDUE` notifications and flips eligible bookings to
  `OVERDUE` (BR-020)

The job must be idempotent: a given reminder type must not be generated twice for
the same booking.

---

## BR-034 – Admin Provisioning

The first ADMIN account is created only by the seed script (`npm run seed:admin`)
using `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Public registration can
never create an ADMIN account (see BR-002).

---

## BR-035 – Dashboard Revenue Definition

`monthlyRevenue` is the sum of `payment.amount` for payments with status `PAID`
and `paidAt` within the current calendar month.

---

## BR-036 – Booking Lifecycle Triggers

- A new booking is created as `PENDING`.
- `PENDING -> CONFIRMED` happens automatically when its payment succeeds
  (`POST /payments` returning status `PAID`), or manually by an admin via
  `PUT /bookings/:id/status`.
- `CONFIRMED -> PICKED_UP` is set by an admin when the item is handed over.
- `PICKED_UP -> RETURNED` happens when a return is processed (`POST /returns`).
- `RETURNED -> COMPLETED` happens when the return is settled
  (`POST /returns/:id/settle`).
- `-> OVERDUE` is set by the reminder job (BR-033) when the return date passes
  and the item is still out.
- `-> CANCELLED` is set by the customer (BR-014) or an admin, only from `PENDING`
  or `CONFIRMED`.

---

## BR-037 – Payment Guard

`POST /payments` is allowed only for a booking that belongs to the current
customer and is in status `PENDING` or `CONFIRMED` and does not already have a
`PAID` payment.

- Attempting to pay a booking that already has a `PAID` payment returns
  `PAYMENT_ALREADY_PROCESSED`.
- Attempting to pay a `CANCELLED`, `COMPLETED`, `RETURNED` or `OVERDUE` booking
  returns `BOOKING_INVALID_STATUS`.
- Only methods `UPI`, `CARD` or `CASH_ON_PICKUP` are accepted
  (`PAYMENT_INVALID_METHOD` otherwise).

The payment `amount` equals the booking `totalAmount` (BR-009) and is never
submitted by the client.

---

## BR-038 – Damaged Returns and Deposit Forfeiture

- A return is marked `DAMAGED` when the returned item's `condition` is
  `DAMAGED` (see the return condition enum in CONTRACTS.md).
- On settlement the admin may enter a `damageCharge` (default 0).
- `depositRefunded = max(0, booking.securityDeposit - damageCharge)`.
- The late fine is collected separately via `finePaid`; it is not deducted from
  the deposit by default.
- The backend computes `depositRefunded`; the client submits neither
  `depositRefunded` nor `fine`.
