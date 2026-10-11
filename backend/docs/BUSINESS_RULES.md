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

The backend must return `BOOKING_OVERLAP` (HTTP 409; see ERROR_CODES.md).

- Return HTTP `409` with `BOOKING_OVERLAP` only when a fresh availability/inventory calculation establishes that the requested quantity is unavailable for the requested rental period.
- Exhausting bounded transaction retries due to transient database conflicts does not, by itself, prove inventory is insufficient and must not be mapped to `BOOKING_OVERLAP`.
- If retries are exhausted without establishing insufficient inventory, return the documented database error (`DATABASE_ERROR` with HTTP 500).

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

Payment is simulated for the college version.

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

Rules by payment method:

- **Electronic payments (`UPI`, `CARD`):**
  - A simulated payment attempt defaults to success: `POST /payments` records status `PAID` with a `paidAt` timestamp and automatically transitions the eligible `PENDING` booking to `CONFIRMED` in the same MongoDB transaction.
  - An administrator cannot manually confirm an unpaid electronic booking.
  - `FAILED` is reserved for the explicitly simulated development failure test path (`X-Simulate-Payment: FAILED` or method `TEST_FAIL`). A failed payment leaves the booking in its current state.
  - Pickup requires an existing payment with status `PAID`.

- **Cash on pickup (`CASH_ON_PICKUP`):**
  - When a customer selects `CASH_ON_PICKUP` via `POST /payments`, the backend creates a single payment record in status `PENDING` with `paidAt = null`. It does not record the payment as paid.
  - An administrator may confirm the booking (`PENDING -> CONFIRMED`) while that existing cash payment remains `PENDING`. Confirmation is permitted only when the booking has an existing `PENDING` payment whose method is `CASH_ON_PICKUP`. An unpaid booking without a payment record cannot be manually confirmed.
  - At physical handover, the admin records the cash collection by updating the existing pending payment to `PAID` and transitions the booking to `PICKED_UP` atomically in the same MongoDB transaction.
  - Do not create a second payment record when collecting cash at pickup.
  - An unpaid cash payment (`PENDING`) must not count toward paid revenue.
  - If cash collection cannot be recorded successfully, the booking must not transition to `PICKED_UP`.

---

## BR-016 – Pickup

Handover of clothing items is controlled strictly by administrative pickup rules:

1. Only an `ADMIN` may mark a booking as `PICKED_UP`.
2. The booking must currently be in status `CONFIRMED`.
3. For electronic methods (`UPI` and `CARD`), a payment with status `PAID` must already exist. An unpaid non-cash booking must not bypass the payment requirement and cannot transition to `PICKED_UP`.
4. For `CASH_ON_PICKUP`, the admin records the cash collection at handover. The admin updates the existing pending payment to `PAID` (setting `paidAt`).
5. Cash payment update and booking transition to `PICKED_UP` must succeed atomically in a single MongoDB transaction session.
6. If cash collection cannot be recorded successfully, the booking must not transition to `PICKED_UP`.
7. Reject duplicate pickup attempts, invalid booking states (`BOOKING_INVALID_STATUS`), and duplicate payment collection (`PAYMENT_ALREADY_PROCESSED`).

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

## BR-028 – Chatbot (Deferred / Out of Scope)

Chatbot functionality is outside the current project scope and deferred to a future extension (see BR-029).

If a rule-based customer support assistant is introduced in a future phase:

- It may answer read-only informational questions (e.g. how to rent, security deposit, return policy, late fine calculation).
- It must not be allowed to modify bookings or inventory.

No chatbot endpoints, database collections, or implementation features are included in the current scope.

---

## BR-029 – Scope Control

The initial implementation does not require:

- Chatbot assistant (see BR-028)
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

- Cancelling a booking does not automatically refund a payment. The separately authorized refund workflow remains responsible for all refunds.
- A refund sets `payment.status = REFUNDED`, records `refundedAt`, and does not change the original `amount`. Refunds are simulated.
- Prevent duplicate refunds: a payment already in status `REFUNDED` must not be refunded again (`PAYMENT_ALREADY_PROCESSED`).
- A pending cash payment (`CASH_ON_PICKUP` with status `PENDING`) must not be refunded as if it were paid (`PAYMENT_NOT_REFUNDABLE`).
- Once a `CASH_ON_PICKUP` payment has been collected at handover and marked `PAID`, it follows the standard refund rules if the booking is cancelled and eligible.

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

Payments in `PENDING` status (including pending `CASH_ON_PICKUP` payments),
`FAILED`, or `REFUNDED` status must not be counted in revenue.

---

## BR-036 – Booking Lifecycle Triggers

- A new booking is created as `PENDING`.
- `PENDING -> CONFIRMED`:
  - Automatically when electronic payment (`UPI`, `CARD`) succeeds (`POST /payments` returning status `PAID`); the payment and booking confirmation happen atomically in the same MongoDB transaction. An administrator cannot manually confirm an unpaid electronic booking.
  - Manually by an admin via `PUT /bookings/:id/status` ONLY for a `CASH_ON_PICKUP` booking that has an existing `PENDING` payment record whose method is `CASH_ON_PICKUP`. An unpaid booking without a payment record cannot be manually confirmed.
- `CONFIRMED -> PICKED_UP`:
  - Set by an admin via `PUT /bookings/:id/status` at handover.
  - For `UPI` and `CARD`, requires an existing `PAID` payment.
  - For `CASH_ON_PICKUP`, requires recording cash collection: the existing `PENDING` payment is updated to `PAID` and the booking is transitioned to `PICKED_UP` atomically in one transaction.
- `PICKED_UP -> RETURNED`: happens when a return is processed (`POST /returns`).
- `RETURNED -> COMPLETED`: happens when the return is settled (`POST /returns/:id/settle`).
- `-> OVERDUE`: set by the reminder job (BR-033) when the return date passes and the item is still out.
- `-> CANCELLED`: set by the customer (BR-014) or an admin, only from `PENDING` or `CONFIRMED`.

---

## BR-037 – Payment Guard

`POST /payments` is allowed only for a booking that belongs to the current
customer and is in status `PENDING` or `CONFIRMED`.

- Attempting to pay or initiate payment for a booking that already has a payment record (whether `PAID` or a pending `CASH_ON_PICKUP` payment) returns `PAYMENT_ALREADY_PROCESSED`.
- Attempting to pay a `CANCELLED`, `COMPLETED`, `RETURNED` or `OVERDUE` booking returns `BOOKING_INVALID_STATUS`.
- Only methods `UPI`, `CARD` or `CASH_ON_PICKUP` are accepted (`PAYMENT_INVALID_METHOD` otherwise).
- For `UPI` and `CARD`, a successful payment sets status `PAID` and automatically confirms the booking.
- For `CASH_ON_PICKUP`, `POST /payments` creates a single `PENDING` payment record with `paidAt = null`. At pickup handover, the admin records the cash collection by updating this existing pending payment to `PAID`. A second payment record is never created.
- The payment `amount` equals the booking `totalAmount` (BR-009) and is never submitted by the client.

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
