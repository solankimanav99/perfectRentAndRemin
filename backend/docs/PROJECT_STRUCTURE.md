# Perfect Rent & Remind – Backend Project Structure

## 1. Purpose

This document defines the backend architecture and folder responsibilities for the
**Perfect Rent & Remind – Smart Clothing Rental Management System**.

The backend is a REST API built with:

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs

The architecture is intentionally simple enough for a 5th-semester AWT project,
while keeping business logic separated from HTTP and database code.

---

## 2. High-Level Architecture

```text
Customer / Admin
       |
       v
React Frontend
       |
       | HTTP / REST API
       v
Express Routes
       |
       v
Controllers
       |
       v
Services
       |
       v
Mongoose Models
       |
       v
MongoDB
```

### Responsibility of each layer

| Layer | Responsibility |
|---|---|
| Routes | Define API URLs, HTTP methods, middleware and controller mapping |
| Middleware | Authentication, authorization, validation and error handling |
| Controllers | Read request data and produce HTTP responses |
| Services | Business rules and application logic |
| Models | MongoDB/Mongoose schemas and database access |
| Validators | Validate request body/query/params |
| Utils | Small reusable helper functions |
| Config | Database and environment configuration |

---

## 3. Recommended Folder Structure

```text
backend/
│
├── docs/
│   ├── CONTRACTS.md
│   ├── API_ENDPOINTS.md
│   ├── DATABASE_DESIGN.md
│   ├── BUSINESS_RULES.md
│   ├── ERROR_CODES.md
│   └── PROJECT_STRUCTURE.md
│
├── src/
│   ├── config/
│   │   ├── db.js
│   │   ├── env.js
│   │   └── scheduler.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── clothing.controller.js
│   │   ├── category.controller.js
│   │   ├── booking.controller.js
│   │   ├── payment.controller.js
│   │   ├── return.controller.js
│   │   ├── notification.controller.js
│   │   ├── admin.controller.js
│   │   └── chatbot.controller.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Clothing.js
│   │   ├── Category.js
│   │   ├── Booking.js
│   │   ├── Payment.js
│   │   ├── Return.js
│   │   └── Notification.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── clothing.routes.js
│   │   ├── category.routes.js
│   │   ├── booking.routes.js
│   │   ├── payment.routes.js
│   │   ├── return.routes.js
│   │   ├── notification.routes.js
│   │   ├── admin.routes.js
│   │   └── chatbot.routes.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── admin.middleware.js
│   │   ├── validate.middleware.js
│   │   └── error.middleware.js
│   │
│   ├── services/
│   │   ├── availability.service.js
│   │   ├── booking.service.js
│   │   ├── fine.service.js
│   │   ├── reminder.service.js
│   │   └── payment.service.js
│   │
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── clothing.validator.js
│   │   ├── booking.validator.js
│   │   └── return.validator.js
│   │
│   ├── utils/
│   │   ├── generateToken.js
│   │   ├── calculateRental.js
│   │   ├── calculateFine.js
│   │   └── constants.js
│   │
│   ├── app.js
│   └── server.js
│
├── tests/
│   ├── auth.test.js
│   ├── clothing.test.js
│   ├── booking.test.js
│   ├── availability.test.js
│   ├── payment.test.js
│   ├── return.test.js
│   └── reminder.test.js
│
├── scripts/
│   └── seedAdmin.js
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 4. Core Implementation Order

The recommended implementation order is:

1. Project setup
2. Environment configuration
3. MongoDB connection
4. Express application
5. User model
6. Authentication
7. Authentication middleware
8. Admin authorization
9. Category model and CRUD
10. Clothing model and CRUD
11. Availability service
12. Booking model and booking service
13. Payment simulation
14. Return management
15. Fine calculation
16. Notification/reminder system
17. Reminder scheduler (node-cron)
18. Admin dashboard endpoints
19. Chatbot
20. Admin seed script
21. Tests
22. Frontend integration

---

## 5. Important Design Rule

Controllers should remain thin.

Example:

```text
POST /api/bookings
        |
        v
booking.routes.js
        |
        v
booking.controller.js
        |
        v
booking.service.js
        |
        +--> availability.service.js
        |
        +--> Booking model
        |
        +--> Clothing model
```

The booking controller should not contain the complete overlap algorithm.

---

## 6. Authentication Flow

```text
Register/Login
      |
      v
Backend validates credentials
      |
      v
Password checked/hashed with bcryptjs
      |
      v
JWT generated
      |
      v
Frontend stores token
      |
      v
Protected API request
      |
      v
auth.middleware.js
      |
      v
req.user populated
```

Admin routes additionally pass through:

```text
auth.middleware
      |
      v
admin.middleware
      |
      v
Controller
```

---

## 7. Core Business Services

### availability.service.js

Responsible for:

- Checking overlapping bookings
- Calculating reserved quantity
- Calculating available quantity
- Preventing double booking

### booking.service.js

Responsible for:

- Validating dates
- Checking inventory
- Calculating rental duration
- Calculating rental amount
- Calculating deposit
- Creating/updating bookings

### fine.service.js

Responsible for:

- Calculating late days
- Calculating late fine
- Applying the configured fine-per-day amount

### reminder.service.js

Responsible for:

- 3-day reminders
- 1-day reminders
- Due-date reminders
- Overdue reminders

### payment.service.js

Responsible for simulated payment processing.

---

## 8. Scope Control

The following are intentionally not core backend modules at the beginning:

- Real payment gateway
- Email/SMS/WhatsApp integration
- AI recommendation engine
- QR-code workflow
- Reviews
- Wishlist

They may be added later without changing the core rental workflow.

---

## 9. Scheduled Jobs and Admin Provisioning

### Reminder scheduler

`src/config/scheduler.js` starts a `node-cron` job on server boot, using the
`REMINDER_CRON` expression (default `0 9 * * *`, i.e. 09:00 daily). The job calls
`reminder.service.js` to generate return reminders and to mark overdue bookings
(see BR-033). The job must be idempotent.

### Admin seed script

`scripts/seedAdmin.js` (run with `npm run seed:admin`) creates or updates the
initial ADMIN account from `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`. This
is the only supported way to create an ADMIN account (see BR-034). The script
must hash the password with bcryptjs and must not run as part of the API.

### Server middleware

`src/app.js` should apply `helmet`, `cors` (origin from `CORS_ORIGIN`), `morgan`
logging, a rate limiter, and the global `error.middleware.js` handler.
