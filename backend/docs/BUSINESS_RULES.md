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
For the college version:
```text
rentalDuration = number of rental days
```
The exact date calculation must be implemented consistently throughout the
backend.

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
The backend obtains the deposit from the clothing record and includes it in
the booking calculation.

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

---

## BR-011 – Overlapping Booking Rule
Two booking periods overlap when:
```text
existingStart < requestedEnd
AND
existingEnd > requestedStart
```
Only relevant active bookings should reserve inventory.
Cancelled bookings must not reserve inventory.
Returned/completed bookings whose rental period has ended must not reserve
future inventory.

---

## BR-012 – Double Booking Prevention
If the requested quantity is not available for the requested date range:
```text
booking must be rejected
```
The backend must return:
```text
BOOKING_OVERLAP
```
or an equivalent availability error defined in ERROR_CODES.md.

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
The backend should validate status transitions.

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
fine = lateDays × 100
```
The fine rate should ideally be stored as a configurable backend constant.

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
- View their payments
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

These are optional future extensions.
