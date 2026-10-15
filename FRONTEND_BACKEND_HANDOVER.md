# Perfect Rent & Remind – Frontend–Backend Integration Handover

**Document Version:** 1.0.0  
**Target Audience:** Frontend Development Team  
**Author:** Backend Engineering Team  
**Repository:** `PerfectRentAndRemind`  
**Base URL (Local Development):** `http://localhost:5000/api`  
**Frontend URL (Local Development):** `http://localhost:3000`  

---

## Table of Contents
1. [A. Project Overview](#a-project-overview)
2. [B. Backend Implementation Status](#b-backend-implementation-status)
3. [C. Exact API Reference for Frontend Developers](#c-exact-api-reference-for-frontend-developers)
   - [Common Request/Response Format](#common-requestresponse-format)
   - [Authentication Endpoints (`/api/auth`)](#1-authentication-endpoints-apiauth)
   - [User Profile Endpoints (`/api/users`)](#2-user-profile-endpoints-apiusers)
   - [Category Endpoints (`/api/categories`)](#3-category-endpoints-apicategories)
   - [Clothing Inventory Endpoints (`/api/clothing`)](#4-clothing-inventory-endpoints-apiclothing)
   - [Booking Endpoints (`/api/bookings`)](#5-booking-endpoints-apibookings)
   - [Payment Endpoints (`/api/payments`)](#6-payment-endpoints-apipayments)
   - [Return & Settlement Endpoints (`/api/returns`)](#7-return--settlement-endpoints-apireturns)
   - [System Health (`/api/health`)](#8-system-health-apihealth)
4. [D. Authentication Integration Guide](#d-authentication-integration-guide)
5. [E. Data Contracts & Business Rules](#e-data-contracts--business-rules)
6. [F. Deferred Endpoints & Backend Limitations](#f-deferred-endpoints--backend-limitations)
7. [G. Step-by-Step Frontend Integration Plan](#g-step-by-step-frontend-integration-plan)
8. [H. Local Development Setup & Execution](#h-local-development-setup--execution)
9. [I. End-to-End Testing & Verification Checklist](#i-end-to-end-testing--verification-checklist)
10. [J. Known Discrepancies & Backend Observations](#j-known-discrepancies--backend-observations)
11. [K. Definition of Done](#k-definition-of-done)

---

## A. Project Overview

### 1. Project Purpose
**Perfect Rent & Remind** is a smart clothing rental management system built for clothing rental businesses (developed as an Advanced Web Technology curriculum project).
- **Customers** can register, log in, browse inventory, filter by category/size/color/price, create date-based bookings, choose between simulated electronic payment (`UPI`, `CARD`) or `CASH_ON_PICKUP`, cancel eligible bookings, and track rental status.
- **Administrators** manage clothing inventory, manage categories, confirm cash-on-pickup bookings, process garment handovers, inspect returns, assess late fines/damages, process security deposit settlements, and execute eligible refunds.

### 2. Technology Stack
| Layer | Technologies & Libraries | Port / Address |
|---|---|---|
| **Frontend** | React.js (planned SPA, React Router, Axios/Fetch) | `http://localhost:3000` |
| **Backend** | Node.js, Express.js (v5), Mongoose ODM (v8), Joi (v18), JWT, bcryptjs | `http://localhost:5000` |
| **Database** | MongoDB (v6+/v7+, local or Atlas replica-set supported) | `mongodb://localhost:27017/perfect_rent` |

### 3. Repository Architecture
```text
perfectRentAndRemin/
├── backend/
│   ├── docs/                  # Authoritative specs (API_ENDPOINTS, CONTRACTS, etc.)
│   ├── src/
│   │   ├── config/            # db.js, env.js
│   │   ├── controllers/       # auth, user, category, clothing, booking, payment, return
│   │   ├── middleware/        # auth (protect, admin), error handler, validate
│   │   ├── models/            # User, Category, Clothing, Booking, Payment, Return
│   │   ├── routes/            # Express route mappers
│   │   ├── scripts/           # seedAdmin.js
│   │   ├── services/          # booking.service, payment.service
│   │   ├── utils/             # calculateRental, calculateFine, constants, generateToken
│   │   ├── validators/        # Joi validation schemas
│   │   ├── app.js             # Express app & route mounting
│   │   └── server.js          # DB connection & HTTP listener
│   ├── tests/                 # 10 Jest test suites (86 passing tests)
│   ├── .env.example           # Example backend environment variables
│   └── package.json           # Backend dependencies and scripts
├── frontend/
│   └── .gitkeep               # Frontend root directory (ready for React app initialization)
├── FEATURES.md                # Feature priority breakdown (P0, P1, P2)
├── README.md                  # Project overview & high-level architecture
└── FRONTEND_BACKEND_HANDOVER.md # This integration guide
```

### 4. Communication Protocol & CORS
- The frontend and backend communicate exclusively over **JSON REST APIs**.
- **CORS Configuration:** The backend uses `cors({ origin: env.CORS_ORIGIN })`. By default, `CORS_ORIGIN` is configured as `http://localhost:3000`. If you run the frontend on a different port (e.g. Vite on `5173`), set `CORS_ORIGIN=http://localhost:5173` in `backend/.env`.
- Authenticated requests must pass the JWT in the standard HTTP header:
  ```http
  Authorization: Bearer <JWT_TOKEN>
  ```

---

## B. Backend Implementation Status

Every feature is classified into one of five verified statuses based on direct repository inspection and test suite verification:

| Module / Feature | Status | Verification & Evidence |
|---|---|---|
| **User Registration & Login** | **Implemented & Verified by Tests** | Tested in `tests/auth.test.js`, `tests/user.test.js`, `tests/e2e.integration.test.js`. Password hashing, JWT generation, public customer role restriction verified. |
| **User Profiles (`/api/users/profile`)** | **Implemented & Verified by Tests** | Tested in `tests/profile.test.js`. GET profile & PATCH profile (name, phone) verified. Role/email changes rejected. |
| **Category Management (`/api/categories`)** | **Implemented & Verified by Tests** | Tested in `tests/category.test.js`. CRUD verified. 409 rejection when category is referenced by clothing verified. |
| **Clothing Browsing & Pagination** | **Implemented & Verified by Tests** | Tested in `tests/clothing.test.js`. Search, size, color, condition, price range filtering and pagination verified. |
| **Clothing Admin CRUD** | **Partially Implemented** | `POST /api/clothing` verified. `PUT /api/clothing/:id` works for metadata and quantity increase. **Quantity reduction returns 501. `DELETE /api/clothing/:id` returns 501.** |
| **Clothing Date Availability Check** | **Deferred / Not Implemented** | `GET /api/clothing/:id/availability` returns HTTP 501 `NOT_IMPLEMENTED`. Date filters on `GET /api/clothing` return 501. |
| **Booking Creation & Concurrency** | **Implemented & Verified by Tests** | Tested in `tests/booking.test.js` & `tests/e2e.integration.test.js`. Concurrency retry protocol, half-open UTC date overlap, inventory holding statuses verified. |
| **Booking Listing & Detail** | **Implemented & Verified by Tests** | Tested in `tests/booking.test.js`. Customer isolation verified. `GET /api/bookings` returns caller's bookings. |
| **Booking Cancellation** | **Implemented & Verified by Tests** | Tested in `tests/booking.test.js`. Allows cancellation from `PENDING` or `CONFIRMED`. Releases inventory immediately. |
| **Admin Booking Status Transitions** | **Implemented & Verified by Tests** | `PUT /api/bookings/:id/status` verified for cash booking confirmation and physical handover to `PICKED_UP`. |
| **Payment Creation & Simulation** | **Implemented & Verified by Tests** | Tested in `tests/payment.test.js`. Simulated `UPI` and `CARD` atomically confirm bookings. `CASH_ON_PICKUP` records single `PENDING` record. Unique `bookingId` index prevents duplicate payments. |
| **Refunds (`/api/payments/:id/refund`)** | **Implemented & Verified by Tests** | Tested in `tests/payment.test.js`. Admin-only refund of `PAID` payments on `CANCELLED` bookings. Uncollected cash rejected (`400 PAYMENT_NOT_REFUNDABLE`). |
| **Returns (`/api/returns`)** | **Implemented & Verified by Tests** | Tested in `tests/return.test.js`. Admin creation for `PICKED_UP`/`OVERDUE` bookings, UTC calendar late fine calculation (₹100/day), customer masking verified. |
| **Return Settlement (`/api/returns/:id/settle`)** | **Implemented & Verified by Tests** | Tested in `tests/return.test.js`. Calculates deposit refund (`securityDeposit - damageCharge`), marks `settled: true`, idempotently rejects repeat attempts with 409. |
| **In-App Return Notifications** | **Deferred / Not Implemented** | No `Notification` model, routes, or controllers exist in `backend/src/`. |
| **Background Cron Reminders** | **Deferred / Not Implemented** | No background scheduler or node-cron jobs exist in `backend/src/`. |
| **Admin Dashboard / Reports Endpoints** | **Deferred / Not Implemented** | Documented in `API_ENDPOINTS.md` (`/api/admin/dashboard`, `/api/admin/reports`), but routes are not mounted in `app.js`. Admins inspect all payments via `GET /api/payments` and all returns via `GET /api/returns`. |
| **AI Support Chatbot** | **Deferred / Out of Scope** | Explicitly out of scope per business rules BR-028 & BR-029. |

---

## C. Exact API Reference for Frontend Developers

### Common Request/Response Format

#### Success Envelope
Single Resource:
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... }
}
```

Paginated Collection (Clothing only):
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "totalItems": 45,
      "totalPages": 4
    }
  }
}
```

Unpaginated / Direct Array Collection (Categories, Bookings, Payments, Returns):
```json
{
  "success": true,
  "data": [ ... ]
}
```

#### Error Envelope
Every backend error returns:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description of error"
  }
}
```

---

### 1. Authentication Endpoints (`/api/auth`)

#### `POST /api/auth/register`
- **Purpose:** Register a new customer account.
- **Auth:** Public (No token required).
- **Request Body:**
  ```json
  {
    "name": "Alison Solanki",
    "email": "alison@example.com",
    "password": "password123",
    "phone": "9876543210"
  }
  ```
  *Note:* `password` must be at least 6 characters. Public registration always assigns `role: "CUSTOMER"`. Sending `role: "ADMIN"` is ignored/prevented.
- **Success (201 Created):**
  ```json
  {
    "success": true,
    "message": "Registration successful.",
    "data": {
      "user": {
        "id": "670aa1b2c3d4e5f6a7b8c9d0",
        "name": "Alison Solanki",
        "email": "alison@example.com",
        "phone": "9876543210",
        "role": "CUSTOMER",
        "createdAt": "2026-10-12T10:00:00.000Z",
        "updatedAt": "2026-10-12T10:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Errors:**
  - `400` `AUTH_EMAIL_EXISTS`: Email is already registered.
  - `400` `VALIDATION_ERROR`: Missing name/email/password or invalid email.

#### `POST /api/auth/login`
- **Purpose:** Log in with email and password to obtain a JWT.
- **Auth:** Public.
- **Request Body:**
  ```json
  {
    "email": "alison@example.com",
    "password": "password123"
  }
  ```
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "user": {
        "id": "670aa1b2c3d4e5f6a7b8c9d0",
        "name": "Alison Solanki",
        "email": "alison@example.com",
        "phone": "9876543210",
        "role": "CUSTOMER"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Errors:**
  - `401` `AUTH_INVALID_CREDENTIALS`: Invalid email or password.
  - `400` `VALIDATION_ERROR`: Missing email or password.

#### `GET /api/auth/me`
- **Purpose:** Fetch the currently authenticated user's data from the token.
- **Auth:** Required (`Bearer <token>`). Any role (`CUSTOMER` or `ADMIN`).
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "670aa1b2c3d4e5f6a7b8c9d0",
        "name": "Alison Solanki",
        "email": "alison@example.com",
        "phone": "9876543210",
        "role": "CUSTOMER"
      }
    }
  }
  ```
- **Errors:**
  - `401` `AUTH_TOKEN_MISSING` / `AUTH_TOKEN_INVALID` / `AUTH_ACCOUNT_NOT_FOUND`.

#### `POST /api/auth/logout`
- **Purpose:** Stateless logout.
- **Auth:** Required (`Bearer <token>`).
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully."
  }
  ```

---

### 2. User Profile Endpoints (`/api/users`)

#### `GET /api/users/profile`
- **Purpose:** Retrieve the profile of the logged-in user.
- **Auth:** Required (`Bearer <token>`).
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "670aa1b2c3d4e5f6a7b8c9d0",
        "name": "Alison Solanki",
        "email": "alison@example.com",
        "phone": "9876543210",
        "role": "CUSTOMER"
      }
    }
  }
  ```

#### `PATCH /api/users/profile`
- **Purpose:** Update editable profile fields (`name`, `phone`).
- **Auth:** Required (`Bearer <token>`).
- **Request Body (Partial allowed):**
  ```json
  {
    "name": "Alison S.",
    "phone": "9998887776"
  }
  ```
  *Note:* Attempting to send `email`, `role`, or `password` will be rejected by Joi validation (`VALIDATION_ERROR`).
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully.",
    "data": {
      "user": {
        "id": "670aa1b2c3d4e5f6a7b8c9d0",
        "name": "Alison S.",
        "email": "alison@example.com",
        "phone": "9998887776",
        "role": "CUSTOMER"
      }
    }
  }
  ```

---

### 3. Category Endpoints (`/api/categories`)

#### `GET /api/categories`
- **Purpose:** List all clothing categories.
- **Auth:** Public.
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "670ab001c3d4e5f6a7b8c901",
        "name": "Sherwani",
        "description": "Traditional wedding wear"
      }
    ]
  }
  ```

#### `POST /api/categories`
- **Purpose:** Create a new category.
- **Auth:** Required (`Bearer <token>`), **ADMIN only**.
- **Request Body:**
  ```json
  {
    "name": "Lehenga",
    "description": "Designer wedding lehengas"
  }
  ```
- **Success (201 Created):**
  ```json
  {
    "success": true,
    "message": "Category created successfully.",
    "data": {
      "id": "670ab002c3d4e5f6a7b8c902",
      "name": "Lehenga",
      "description": "Designer wedding lehengas"
    }
  }
  ```
- **Errors:**
  - `400` `CATEGORY_EXISTS`: Category name already exists.
  - `403` `FORBIDDEN`: Non-admin caller.

#### `PUT /api/categories/:id`
- **Purpose:** Update category name and description.
- **Auth:** Required (`Bearer <token>`), **ADMIN only**.
- **Request Body:**
  ```json
  {
    "name": "Bridal Lehenga",
    "description": "Bridal collections"
  }
  ```
- **Success (200 OK):** Returns updated category resource.

#### `DELETE /api/categories/:id`
- **Purpose:** Delete a category.
- **Auth:** Required (`Bearer <token>`), **ADMIN only**.
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "message": "Category deleted successfully."
  }
  ```
- **Errors:**
  - `409` `VALIDATION_ERROR`: Cannot delete category that is currently referenced by clothing items.
  - `404` `CATEGORY_NOT_FOUND`.

---

### 4. Clothing Inventory Endpoints (`/api/clothing`)

#### `GET /api/clothing`
- **Purpose:** Browse and search clothing with filters and pagination.
- **Auth:** Public.
- **Query Parameters:**
  - `search` (string): Case-insensitive regex match on clothing name.
  - `category` (string): Category ID (24-char hex) or Category name.
  - `size` (string): Size match (e.g. `S`, `M`, `L`, `XL`).
  - `color` (string): Color match.
  - `minPrice` (number), `maxPrice` (number): Rental price range.
  - `availability` (`true` | `false`): Filter for active available stock (`availabilityStatus === 'AVAILABLE' && quantity > 0`).
  - `page` (number, default: 1).
  - `limit` (number, default: 12).
  - *Caution:* Do **not** send `startDate` or `endDate` query parameters (returns 501 `NOT_IMPLEMENTED`).
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "670ac111c3d4e5f6a7b8c111",
          "name": "Royal Sherwani",
          "category": {
            "id": "670ab001c3d4e5f6a7b8c901",
            "name": "Sherwani"
          },
          "description": "Traditional wedding sherwani",
          "size": "L",
          "color": "Maroon",
          "rentalPrice": 1500,
          "securityDeposit": 3000,
          "quantity": 5,
          "availableQuantity": 5,
          "image": "https://example.com/sherwani.jpg",
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

#### `GET /api/clothing/:id`
- **Purpose:** Fetch detailed single clothing product.
- **Auth:** Public.
- **Success (200 OK):** Returns single clothing item in `data`.

#### `POST /api/clothing`
- **Purpose:** Add a new clothing item.
- **Auth:** Required (`Bearer <token>`), **ADMIN only**.
- **Request Body:**
  ```json
  {
    "name": "Embroidered Kurta Set",
    "categoryId": "670ab001c3d4e5f6a7b8c901",
    "description": "Silk kurta with churidar",
    "size": "M",
    "color": "Ivory",
    "rentalPrice": 800,
    "securityDeposit": 1500,
    "quantity": 3,
    "image": "https://example.com/kurta.jpg",
    "condition": "EXCELLENT",
    "availabilityStatus": "AVAILABLE"
  }
  ```
  - Allowed `condition`: `EXCELLENT`, `GOOD`, `FAIR`, `MAINTENANCE`.
  - Allowed `availabilityStatus`: `AVAILABLE`, `UNAVAILABLE`, `MAINTENANCE`.
- **Success (201 Created):** Returns populated clothing resource in `data`.

#### `PUT /api/clothing/:id`
- **Purpose:** Update clothing fields or increase quantity.
- **Auth:** Required (`Bearer <token>`), **ADMIN only**.
- **Important Restriction:** If `quantity` in request is strictly less than existing `quantity`, the backend responds with `501 NOT_IMPLEMENTED`. Quantity increases and metadata updates are allowed.

---

### 5. Booking Endpoints (`/api/bookings`)

#### `POST /api/bookings`
- **Purpose:** Create a rental reservation.
- **Auth:** Required (`Bearer <token>`), **CUSTOMER only**.
- **Request Body:**
  ```json
  {
    "clothingId": "670ac111c3d4e5f6a7b8c111",
    "rentalStartDate": "2026-11-10",
    "returnDate": "2026-11-12",
    "quantity": 1
  }
  ```
  *Rules:*
  - Dates must strictly follow `YYYY-MM-DD`.
  - `rentalStartDate` must be earlier than `returnDate` and cannot be in the past.
  - Dates use half-open interval: `2026-11-10` to `2026-11-12` = 2 rental days.
- **Pricing Calculation (Automatic by backend):**
  - `rentalDuration` = `2` days
  - `rentalAmount` = `rentalPrice * quantity * rentalDuration`
  - `securityDeposit` = flat `clothing.securityDeposit`
  - `totalAmount` = `rentalAmount + securityDeposit`
- **Success (201 Created):**
  ```json
  {
    "success": true,
    "message": "Booking created successfully.",
    "data": {
      "id": "670ad222c3d4e5f6a7b8c222",
      "clothingId": "670ac111c3d4e5f6a7b8c111",
      "rentalStartDate": "2026-11-10T00:00:00.000Z",
      "returnDate": "2026-11-12T00:00:00.000Z",
      "quantity": 1,
      "rentalDuration": 2,
      "rentalAmount": 3000,
      "securityDeposit": 3000,
      "totalAmount": 6000,
      "status": "PENDING"
    }
  }
  ```
- **Errors:**
  - `409` `BOOKING_OVERLAP`: Inventory is insufficient for selected dates due to existing overlapping bookings.
  - `400` `BOOKING_DATE_INVALID`: Invalid date format, past start date, or duration < 1.
  - `400` `BOOKING_QUANTITY_INVALID`: Requested quantity exceeds physical stock.
  - `400` `CLOTHING_UNAVAILABLE`: Item availabilityStatus is not AVAILABLE.
  - `500` `DATABASE_ERROR`: Concurrency retry limit exhausted without inventory deficit.

#### `GET /api/bookings`
- **Purpose:** List bookings.
- **Auth:** Required (`Bearer <token>`).
- **Behavior:** Returns an array of bookings belonging to the calling customer (`customerId: req.user._id`).
- **Query Parameters:** `status` (optional filter, e.g. `PENDING`, `CONFIRMED`), `page`, `limit`.
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "670ad222c3d4e5f6a7b8c222",
        "customerId": "670aa1b2c3d4e5f6a7b8c9d0",
        "clothingId": "670ac111c3d4e5f6a7b8c111",
        "rentalStartDate": "2026-11-10T00:00:00.000Z",
        "returnDate": "2026-11-12T00:00:00.000Z",
        "quantity": 1,
        "rentalDuration": 2,
        "rentalAmount": 3000,
        "securityDeposit": 3000,
        "totalAmount": 6000,
        "status": "PENDING",
        "createdAt": "2026-10-12T10:30:00.000Z",
        "updatedAt": "2026-10-12T10:30:00.000Z"
      }
    ]
  }
  ```

#### `GET /api/bookings/:id`
- **Purpose:** View details of a specific booking.
- **Auth:** Required (`Bearer <token>`). Accessible by the booking owner or any **ADMIN**.
- **Errors:** `403` `FORBIDDEN` if caller is a customer attempting to view another customer's booking. `404` `BOOKING_NOT_FOUND`.

#### `PUT /api/bookings/:id/cancel`
- **Purpose:** Cancel a booking.
- **Auth:** Required (`Bearer <token>`). Allowed by the booking owner or **ADMIN**.
- **Restrictions:** Allowed **only** while booking is in `PENDING` or `CONFIRMED`.
- **Success (200 OK):** Returns booking with `status: "CANCELLED"`. Immediately releases reserved inventory.
- **Errors:**
  - `400` `BOOKING_NOT_CANCELLABLE`: If booking is already `PICKED_UP`, `RETURNED`, `COMPLETED`, `OVERDUE`, or `CANCELLED`.

#### `PUT /api/bookings/:id/status`
- **Purpose:** Execute administrative lifecycle transitions.
- **Auth:** Required (`Bearer <token>`), **ADMIN only**.
- **Supported Transitions:**
  1. **Manual Confirmation for Cash on Pickup (`PENDING -> CONFIRMED`):**
     - Request: `{ "status": "CONFIRMED" }`
     - Permitted **only** when the booking has an existing `PENDING` payment record with `method: "CASH_ON_PICKUP"`.
     - Attempting to confirm an unpaid electronic booking returns `400 BOOKING_INVALID_STATUS`.
  2. **Physical Handover (`CONFIRMED -> PICKED_UP`):**
     - Request: `{ "status": "PICKED_UP" }`
     - For `UPI`/`CARD`: Requires that payment `status` is already `PAID`.
     - For `CASH_ON_PICKUP`: Atomically marks the existing pending payment as `PAID` (recording `paidAt: new Date()`) and transitions the booking to `PICKED_UP`.
  3. **Cancellation (`PENDING/CONFIRMED -> CANCELLED`):**
     - Request: `{ "status": "CANCELLED" }`.
- **Blocked Transitions:**
  - Sending `status: "RETURNED"` or `"COMPLETED"` returns `400 BOOKING_INVALID_STATUS` (returns and settlements must use `/api/returns` endpoints).

---

### 6. Payment Endpoints (`/api/payments`)

#### `POST /api/payments`
- **Purpose:** Submit payment for a booking.
- **Auth:** Required (`Bearer <token>`). Caller must own the booking.
- **Request Body:**
  ```json
  {
    "bookingId": "670ad222c3d4e5f6a7b8c222",
    "method": "UPI"
  }
  ```
  - Allowed `method`: `UPI`, `CARD`, `CASH_ON_PICKUP`.
  - Development Test Hook: In non-production environments, header `X-Simulate-Payment: FAILED` or `method: "TEST_FAIL"` simulates payment failure without confirming the booking.
- **Behavior by Method:**
  - **`UPI` / `CARD` (Simulated Electronic):**
    - The backend sets `amount = booking.totalAmount`, `status = "PAID"`, records `paidAt`, and automatically confirms the booking (`PENDING -> CONFIRMED`) atomically in a MongoDB transaction session.
  - **`CASH_ON_PICKUP`:**
    - Creates a single payment record with `amount = booking.totalAmount`, `status = "PENDING"`, and `paidAt = null`. Does not confirm the booking.
- **Success (201 Created):**
  ```json
  {
    "success": true,
    "message": "Payment processed successfully.",
    "data": {
      "id": "670ae333c3d4e5f6a7b8c333",
      "bookingId": "670ad222c3d4e5f6a7b8c222",
      "customerId": "670aa1b2c3d4e5f6a7b8c9d0",
      "amount": 6000,
      "method": "UPI",
      "status": "PAID",
      "transactionReference": "SIM-784219",
      "paidAt": "2026-10-12T10:35:00.000Z",
      "refundedAt": null,
      "refundReason": null
    }
  }
  ```
- **Errors:**
  - `400` `PAYMENT_ALREADY_PROCESSED`: A payment record already exists for this booking (strict 1:1 cardinality enforced by database unique index).
  - `400` `BOOKING_INVALID_STATUS`: Booking is not in `PENDING` or `CONFIRMED`.
  - `400` `PAYMENT_INVALID_METHOD`: Unsupported payment method.

#### `GET /api/payments`
- **Purpose:** List payments.
- **Auth:** Required (`Bearer <token>`).
- **Behavior:** If caller is `ADMIN`, returns all payments. If `CUSTOMER`, returns only caller's payments.
- **Success (200 OK):** Returns array of payment objects in `data`.

#### `GET /api/payments/:id`
- **Purpose:** Get payment by ID.
- **Auth:** Required (`Bearer <token>`). Customer can view own payment; Admin can view any.

#### `GET /api/bookings/:bookingId/payment`
- **Purpose:** Directly look up the payment for a specific booking.
- **Auth:** Required (`Bearer <token>`). Customer can view own; Admin can view any.
- **Success (200 OK):** Returns payment object in `data`.
- **Errors:** `404` `PAYMENT_NOT_FOUND`: No payment record created yet.

#### `POST /api/payments/:id/refund`
- **Purpose:** Process a refund for a cancelled booking.
- **Auth:** Required (`Bearer <token>`), **ADMIN only**.
- **Request Body (Optional):**
  ```json
  {
    "reason": "Customer cancelled before rental period"
  }
  ```
- **Business Rules:**
  - Payment must currently be in status `PAID`.
  - Associated booking must currently be in status `CANCELLED`.
  - A pending cash payment (`CASH_ON_PICKUP` in `PENDING`) cannot be refunded (`400 PAYMENT_NOT_REFUNDABLE`).
  - Attempting to refund an already refunded payment returns `400 PAYMENT_ALREADY_PROCESSED`.
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "message": "Payment refunded successfully.",
    "data": {
      "id": "670ae333c3d4e5f6a7b8c333",
      "status": "REFUNDED",
      "refundedAt": "2026-10-12T11:00:00.000Z",
      "refundReason": "Customer cancelled before rental period"
    }
  }
  ```

---

### 7. Return & Settlement Endpoints (`/api/returns`)

#### `POST /api/returns`
- **Purpose:** Record the physical return of clothing garments.
- **Auth:** Required (`Bearer <token>`), **ADMIN only**.
- **Request Body:**
  ```json
  {
    "bookingId": "670ad222c3d4e5f6a7b8c222",
    "actualReturnDate": "2026-11-14",
    "condition": "GOOD"
  }
  ```
  - Allowed `condition`: `EXCELLENT`, `GOOD`, `FAIR`, `DAMAGED`.
  - Eligibility: Booking must currently be in status `PICKED_UP` or `OVERDUE`.
- **Late Fine Calculation:**
  - Late days = `max(0, actualReturnDate - expectedReturnDate)` in UTC calendar days.
  - Fine = `lateDays * 100` (₹100 per day per `FINE_PER_DAY`).
  - If return is on or before return date: `lateDays = 0`, `fine = 0`.
- **Status Determination:**
  - If `condition === 'DAMAGED'` -> return `status: "DAMAGED"`
  - Else if `lateDays > 0` -> return `status: "LATE"`
  - Else -> return `status: "RETURNED"`
- **Atomic Booking Update:** Transitions booking to `RETURNED` in the same transaction.
- **Success (201 Created):**
  ```json
  {
    "success": true,
    "message": "Return processed successfully.",
    "data": {
      "id": "670af444c3d4e5f6a7b8c444",
      "bookingId": "670ad222c3d4e5f6a7b8c222",
      "expectedReturnDate": "2026-11-12T00:00:00.000Z",
      "actualReturnDate": "2026-11-14T00:00:00.000Z",
      "lateDays": 2,
      "fine": 200,
      "condition": "GOOD",
      "status": "LATE"
    }
  }
  ```
- **Errors:**
  - `400` `RETURN_ALREADY_COMPLETED`: Return already processed for this booking.
  - `400` `RETURN_INVALID_BOOKING`: Booking is not in `PICKED_UP` or `OVERDUE`.
  - `400` `RETURN_INVALID_DATE`: `actualReturnDate` precedes booking `rentalStartDate`.

#### `GET /api/returns` & `GET /api/returns/:id`
- **Purpose:** Retrieve return records.
- **Auth:** Required (`Bearer <token>`). Admins see all returns; Customers see only their own.
- **Customer Masking Behavior:** When a customer views their return before settlement (`settled === false`), the backend sets `damageCharge: null` and `depositRefunded: null` to avoid confusing the customer before the admin completes formal assessment.

#### `POST /api/returns/:id/settle`
- **Purpose:** Settle security deposit, assess damage charges, record fine collection, and finalize booking.
- **Auth:** Required (`Bearer <token>`), **ADMIN only**.
- **Request Body:**
  ```json
  {
    "damageCharge": 500
  }
  ```
  - `damageCharge` must be `>= 0` and cannot exceed the booking's `securityDeposit`.
- **Backend Settlement Calculation:**
  - `depositRefunded = max(0, booking.securityDeposit - damageCharge)`
  - Marks `finePaid: true`, `settled: true`, `settledAt: new Date()`
  - Atomically transitions booking from `RETURNED -> COMPLETED`.
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "message": "Return settled successfully.",
    "data": {
      "id": "670af444c3d4e5f6a7b8c444",
      "bookingId": "670ad222c3d4e5f6a7b8c222",
      "lateDays": 2,
      "fine": 200,
      "depositRefunded": 2500,
      "finePaid": true,
      "settled": true,
      "settledAt": "2026-10-12T11:45:00.000Z"
    }
  }
  ```
- **Errors:**
  - `409` `SETTLEMENT_ALREADY_COMPLETED`: Return record has already been settled.
  - `400` `VALIDATION_ERROR`: Damage charge exceeds booking security deposit.

---

### 8. System Health (`/api/health`)
- **`GET /api/health`** (Public): Returns `{ "success": true, "message": "Perfect Rent & Remind API is running." }`.

---

## D. Authentication Integration Guide

### 1. Registration & Login Flow
1. **User Registers:** Send `POST /api/auth/register` with `name`, `email`, `password`, `phone`.
2. **User Logs In:** Send `POST /api/auth/login` with `email`, `password`.
3. **Storage:** On 200/201 response, save `data.token` (e.g. in `localStorage` or secure cookie) and store `data.user` in your auth state/context.

### 2. Attaching the JWT Token
Configure an Axios interceptor or fetch wrapper:
```javascript
// src/api/client.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired, missing, or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. Current User Verification (`GET /api/auth/me`)
On application initialization (e.g. inside `App.js` or `AuthContext` `useEffect`):
- Check if a token exists in `localStorage`.
- Call `GET /api/auth/me`. If valid, update state with `response.data.data.user`.
- If it fails (401), clear storage and redirect to login.

### 4. Role-Based Navigation & UI Restrictions
- **User Object Structure:** `{ id: string, name: string, email: string, role: "CUSTOMER" | "ADMIN" }`
- **Customer UI:** Catalog browsing, booking creation, my bookings, my payments.
- **Admin UI:** Add/edit clothing, manage categories, confirm cash bookings, record pickup handover, process returns, settle deposits, issue refunds.
- **Critical Architecture Reminder:** Frontend role checks protect UX and navigation, but **the backend is authoritative**. Every sensitive endpoint strictly verifies `req.user.role === 'ADMIN'`.

### 5. Logout Flow
1. Call `POST /api/auth/logout` with Bearer token.
2. Remove `token` and `user` from client storage.
3. Reset auth state and navigate to `/login`.

---

## E. Data Contracts & Business Rules

### 1. Roles & Permissions
```text
CUSTOMER : Public registration default. Can book clothes, make payments, cancel own bookings, view own returns.
ADMIN    : Seeded via backend script (`npm run seed:admin`). Can manage inventory, confirm bookings, process handover, returns, settlements, and refunds.
```

### 2. Booking Lifecycle & State Transitions
Allowed transitions are strictly validated:

```mermaid
graph TD
    PENDING["PENDING (Reserves Inventory)"]
    CONFIRMED["CONFIRMED (Reserves Inventory)"]
    PICKED_UP["PICKED_UP (Reserves Inventory)"]
    RETURNED["RETURNED (Releases Inventory)"]
    COMPLETED["COMPLETED (Terminal)"]
    CANCELLED["CANCELLED (Terminal / Releases Inventory)"]
    OVERDUE["OVERDUE (Reserves Inventory)"]

    PENDING -->|Electronic Payment Success| CONFIRMED
    PENDING -->|Admin Manual Confirm (Cash on Pickup only)| CONFIRMED
    PENDING -->|Customer or Admin Cancel| CANCELLED

    CONFIRMED -->|Admin Handover (Paid or Cash Collected)| PICKED_UP
    CONFIRMED -->|Customer or Admin Cancel| CANCELLED

    PICKED_UP -->|Admin Return Processed| RETURNED
    PICKED_UP -->|Return Date Passed (Cron/Job)| OVERDUE

    OVERDUE -->|Admin Return Processed| RETURNED

    RETURNED -->|Admin Settle Deposit/Fine| COMPLETED
```

### 3. Inventory Reservation & Date Overlap
- **Reservable Statuses:** A booking holds physical inventory **only** while in `PENDING`, `CONFIRMED`, `PICKED_UP`, or `OVERDUE`.
- **Released Statuses:** `CANCELLED`, `RETURNED`, and `COMPLETED` release inventory.
- **Date Interval Formula:** Overlapping reservations are calculated using UTC dates with a **half-open interval**:
  $$\text{Existing.startDate} < \text{Requested.returnDate} \quad \text{AND} \quad \text{Existing.returnDate} > \text{Requested.startDate}$$
- If available quantity is insufficient, creation is rejected with `409 BOOKING_OVERLAP`.

### 4. Payment Rules: Electronic vs. Cash on Pickup
| Aspect | Electronic (`UPI`, `CARD`) | Cash on Pickup (`CASH_ON_PICKUP`) |
|---|---|---|
| **Payment Creation (`POST /payments`)** | Simulates success; creates payment in `PAID` with `paidAt: now`. | Creates single payment record in `PENDING` with `paidAt: null`. |
| **Booking Confirmation (`PENDING -> CONFIRMED`)** | Happens **automatically and atomically** inside payment transaction. | Admin manually confirms booking via `PUT /bookings/:id/status` while payment remains `PENDING`. |
| **Garment Handover (`CONFIRMED -> PICKED_UP`)** | Admin verifies existing `PAID` payment before marking `PICKED_UP`. | Admin collects cash and updates existing payment to `PAID` atomically with marking `PICKED_UP`. |
| **Second Payment Document** | Never created. Strict 1:1 cardinality enforced by database unique index. | Never created. Existing document is updated in place. |
| **Revenue Counting** | Counted in monthly revenue. | **Not counted** until handover updates payment to `PAID`. |

### 5. Return & Settlement Rules
- **Late Days:** `max(0, actualReturnDate - expectedReturnDate)` in whole UTC calendar days.
- **Late Fine:** `lateDays * 100` (₹100 per late day).
- **Damage Charges:** Assessed by admin at settlement; cannot exceed `booking.securityDeposit`.
- **Deposit Refunded:** `max(0, booking.securityDeposit - damageCharge)`.

---

## F. Deferred Endpoints & Backend Limitations

The following features were deferred during backend development. The frontend **must** avoid calling these endpoints or build around these restrictions:

1. **`GET /api/clothing/:id/availability` (HTTP 501 `NOT_IMPLEMENTED`)**
   - *Impact on Frontend:* Do not call this endpoint to check if an item is available.
   - *Recommended Frontend UX:* Allow the customer to select desired dates and quantity on the booking page and submit the booking request (`POST /api/bookings`). If unavailable, handle the `409 BOOKING_OVERLAP` response cleanly with a clear user prompt: *"This item is already booked for the selected dates. Please choose different dates."*
2. **Date-Filtered Catalog Listing (HTTP 501 `NOT_IMPLEMENTED`)**
   - *Impact on Frontend:* Sending `startDate` or `endDate` query parameters to `GET /api/clothing` returns 501.
   - *Recommended Frontend UX:* Remove rental date pickers from the general catalog search/filter bar. Use category, size, color, and price range filters.
3. **Clothing Quantity Reduction (HTTP 501 `NOT_IMPLEMENTED`)**
   - *Impact on Frontend:* Admins can edit clothing details and increase inventory quantity. If an admin attempts to lower the total quantity on `PUT /api/clothing/:id`, the backend returns 501.
   - *Recommended Frontend UX:* If editing clothing, disable decrementing total stock below the current value.
4. **Clothing Deletion (HTTP 501 `NOT_IMPLEMENTED`)**
   - *Impact on Frontend:* `DELETE /api/clothing/:id` returns 501.
   - *Recommended Frontend UX:* Hide or disable the "Delete Clothing" button in the admin catalog table, or display an informational badge: *"Deactivation preferred over deletion."*
5. **Admin Dedicated Dashboard & Analytics Endpoints**
   - *Impact on Frontend:* `/api/admin/dashboard` and `/api/admin/reports` do not exist.
   - *Recommended Frontend UX:* The Admin Dashboard can compute summary metrics directly by querying `GET /api/clothing` (total items), `GET /api/payments` (revenue and paid count), and `GET /api/returns` (returned and overdue items).
6. **In-App Notification Bell**
   - *Impact on Frontend:* `/api/notifications` routes are not present. Hide the notifications bell until Phase 6 backend notification services are deployed.

---

## G. Step-by-Step Frontend Integration Plan

### Step 1: Initialize the React Frontend
Inspect the `frontend/` directory. Currently, it contains only `.gitkeep`.
- Initialize a React application inside `frontend/` (e.g. using `npx create-react-app .` or Vite `npm create vite@latest . -- --template react`).
- Install core dependencies: `axios`, `react-router-dom`.

### Step 2: Configure Environment Variables
Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Step 3: API Client & Axios Interceptor
Create `src/api/client.js` with base URL, token injection, and 401 redirect handling as outlined in [Section D](#d-authentication-integration-guide).

### Step 4: Authentication State & Context
Create `src/context/AuthContext.js`:
- Provide `user`, `token`, `login(email, password)`, `register(data)`, `logout()`.
- On initial mount, read `token` from `localStorage` and verify via `GET /api/auth/me`.

### Step 5: Public Clothing Catalog & Details
- **Catalog Page (`/` or `/clothing`):** Call `GET /api/clothing?page=1&limit=12`. Render cards with `name`, `image`, `rentalPrice`, `size`, `color`, and category name. Connect filter dropdowns for category, size, color, price range, and search input.
- **Clothing Detail Page (`/clothing/:id`):** Call `GET /api/clothing/:id`. Display security deposit, condition, description, and rental price.

### Step 6: Booking Form
- Provide date pickers (`rentalStartDate`, `returnDate`) formatted as `YYYY-MM-DD`, and a quantity input.
- Calculate and display estimated cost:
  - Duration = days between dates
  - Rental Amount = `rentalPrice * quantity * duration`
  - Total = `rentalAmount + securityDeposit`
- On submit, call `POST /api/bookings`. Handle `409 BOOKING_OVERLAP` with an inline alert.

### Step 7: Payment Modal / Checkout
- After booking creation (or from My Bookings for a `PENDING` booking), present payment options:
  1. `UPI` (Simulated Electronic)
  2. `CARD` (Simulated Electronic)
  3. `CASH_ON_PICKUP` (Cash at store)
- On selection, call `POST /api/payments` with `{ bookingId, method }`.
- If electronic: booking becomes `CONFIRMED` immediately.
- If cash on pickup: displays confirmation message: *"Cash on pickup selected. An administrator will confirm your booking."*

### Step 8: Customer Booking History & Cancellation
- **My Bookings Page (`/my-bookings`):** Call `GET /api/bookings`. Render booking list, status badges, dates, and amounts.
- If status is `PENDING` or `CONFIRMED`: show "Cancel Booking" button, calling `PUT /api/bookings/:id/cancel`.

### Step 9: Admin Management Views (Protected for `role === 'ADMIN'`)
- **Admin Inventory (`/admin/clothing`):** List clothes, add clothing (`POST /api/clothing`), update clothing metadata (`PUT /api/clothing/:id`).
- **Admin Categories (`/admin/categories`):** List categories, add category (`POST /api/categories`), edit category.
- **Admin Cash Confirmations & Handover (`/admin/bookings`):**
  - For cash bookings in `PENDING`: Admin clicks "Confirm Booking" (`PUT /api/bookings/:id/status` with `{ "status": "CONFIRMED" }`).
  - At physical pickup: Admin clicks "Mark Picked Up" (`PUT /api/bookings/:id/status` with `{ "status": "PICKED_UP" }`).
- **Admin Returns (`/admin/returns`):**
  - Record return: select booking, enter actual return date and condition (`POST /api/returns`).
  - Settle return: enter damage charge (`POST /api/returns/:id/settle`).
- **Admin Refunds (`/admin/refunds`):**
  - View cancelled bookings, issue refund for `PAID` payments (`POST /api/payments/:id/refund`).

---

## H. Local Development Setup & Execution

### 1. Prerequisites
- **Node.js:** v18+ or v20+ installed.
- **MongoDB:** Running locally on port `27017` (e.g. `mongod` service or MongoDB Community Server).

### 2. Backend Setup
```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file from .env.example
cp .env.example .env
# (On Windows PowerShell: Copy-Item .env.example .env)

# 4. Seed the initial Administrator account
npm run seed:admin
# Output: Admin account created successfully! (Email: admin@example.com / Password: strongpassword123)

# 5. Start backend development server (with nodemon)
npm run dev
# Server running in development mode on port 5000
# MongoDB Connected: 127.0.0.1
```

### 3. Frontend Setup
```bash
# 1. Navigate to frontend
cd ../frontend

# 2. Install dependencies (once project created)
npm install

# 3. Start development server
npm start
# App running on http://localhost:3000
```

### 4. Running Backend Test Suites
To verify backend health at any time:
```bash
cd backend
npm test
# Result: 10 test suites passed, 86 tests passed
```

### 5. Troubleshooting Common Connection Issues
- **`ECONNREFUSED 127.0.0.1:27017`:** Local MongoDB service is not started. Start your local MongoDB server (`net start MongoDB` on Windows or `brew services start mongodb-community`).
- **CORS Error in Browser Console:** Ensure backend `.env` has `CORS_ORIGIN=http://localhost:3000` (or whichever port your frontend server is bound to).
- **`401 Not authorized, token missing`:** Confirm your Axios/Fetch client is adding the `Authorization: Bearer <token>` header with a space after `Bearer`.
- **`403 Not authorized as an admin`:** Ensure you logged in using the admin credentials (`admin@example.com` / `strongpassword123`) when testing admin routes.

---

## I. End-to-End Testing & Verification Checklist

Use this checklist during integration testing to verify each core workflow:

- [ ] **Customer Registration:**
  - Register with a new email. Verify JWT and user data are received.
  - Verify that sending `role: "ADMIN"` in registration still results in `role: "CUSTOMER"`.
- [ ] **Customer Login & Me:**
  - Log in with registered credentials. Verify token storage in `localStorage`.
  - Refresh the page and confirm `GET /api/auth/me` restores session.
- [ ] **Clothing Browsing & Filters:**
  - View clothing catalog. Verify populated category names render properly.
  - Test search filter, category filter, and price filter.
- [ ] **Date Booking & Overlap:**
  - Select valid future dates (`YYYY-MM-DD`). Confirm booking creation succeeds in `PENDING` status.
  - Attempt to book the same item for overlapping dates when quantity is exhausted. Confirm `409 BOOKING_OVERLAP` is returned and handled gracefully by the UI.
- [ ] **Electronic Payment Flow (`UPI` / `CARD`):**
  - Choose `UPI`. Submit payment. Verify payment is created with status `PAID`.
  - Verify booking status immediately transitions to `CONFIRMED`.
- [ ] **Cash on Pickup Flow:**
  - Create booking. Choose `CASH_ON_PICKUP`.
  - Verify payment is created with status `PENDING` (`paidAt: null`).
  - Verify booking remains `PENDING`.
  - Log in as Admin. Call `PUT /api/bookings/:id/status` with `CONFIRMED`. Verify confirmation succeeds.
  - At handover: Call `PUT /api/bookings/:id/status` with `PICKED_UP`. Verify cash payment is updated to `PAID` with `paidAt` timestamp and booking transitions to `PICKED_UP`.
- [ ] **Booking Cancellation & Refund:**
  - Create and pay for a booking. Cancel the booking via `PUT /api/bookings/:id/cancel`. Verify status is `CANCELLED`.
  - As Admin, call `POST /api/payments/:id/refund`. Verify payment status is updated to `REFUNDED`.
  - Attempt duplicate refund. Verify `400 PAYMENT_ALREADY_PROCESSED` is returned.
- [ ] **Return & Late Fine Processing:**
  - As Admin, record a return via `POST /api/returns` with an actual return date 2 days late.
  - Verify late days = 2, fine = ₹200, return status = `LATE`, and booking status transitions to `RETURNED`.
- [ ] **Return Settlement:**
  - As Admin, call `POST /api/returns/:id/settle` with damage charge.
  - Verify `depositRefunded = securityDeposit - damageCharge`, `settled = true`, and booking transitions to `COMPLETED`.
  - Attempt duplicate settlement. Verify `409 SETTLEMENT_ALREADY_COMPLETED` is returned.
- [ ] **Customer Data Isolation:**
  - Customer A cannot view or pay for Customer B's booking (returns 403).

---

## J. Known Discrepancies & Backend Observations

The following discrepancies exist between the backend documentation files (`backend/docs/`) and the actual implementation in `backend/src/`:

1. **Collection Response Envelope Format:**
   - *Documentation (`CONTRACTS.md` & `API_ENDPOINTS.md`):* States all list endpoints return `{ success: true, data: { items: [...], pagination: { ... } } }`.
   - *Actual Code:* Only `GET /api/clothing` uses `{ items, pagination }`. `GET /api/categories`, `GET /api/bookings`, `GET /api/payments`, and `GET /api/returns` return a direct array in `data`: `{ success: true, data: [ ... ] }`.
   - *Action for Frontend:* Check if `Array.isArray(response.data.data)` or access `response.data.data.items` based on the specific endpoint.
2. **Admin All-Bookings Listing:**
   - *Documentation:* Describes `GET /api/admin/bookings` for administrators to view all customer bookings.
   - *Actual Code:* `GET /api/admin/bookings` is not implemented. `GET /api/bookings` always filters by `customerId: req.user._id`.
   - *Action for Frontend:* For customer views, `GET /api/bookings` works as expected. For admin views, individual bookings can be inspected via `GET /api/bookings/:id` or payment/return records.
3. **Availability Endpoint (`GET /api/clothing/:id/availability`):**
   - *Documentation:* Describes a standalone availability calculation endpoint.
   - *Actual Code:* Returns HTTP 501 `NOT_IMPLEMENTED`.
   - *Action for Frontend:* Do not call this endpoint; rely on `POST /api/bookings` validation and `409 BOOKING_OVERLAP`.
4. **Clothing Deletion & Quantity Reduction:**
   - *Documentation:* Describes complete clothing CRUD.
   - *Actual Code:* `DELETE /api/clothing/:id` and quantity reduction on `PUT /api/clothing/:id` return HTTP 501 `NOT_IMPLEMENTED`.
   - *Action for Frontend:* Disable quantity decrement and deletion in the admin UI.
5. **Notification & Admin Dashboard Routes:**
   - *Documentation:* Contains specifications for `/api/notifications` and `/api/admin/dashboard`.
   - *Actual Code:* Neither module is mounted in `app.js`.
   - *Action for Frontend:* Omit notification bell and compute admin statistics from payments and returns collections directly.

---

## K. Definition of Done

The frontend–backend integration will be considered complete when the following criteria are satisfied:

| Feature / Domain | Backend Readiness | Frontend Integration Status | Verification Method | Remaining Work |
|---|---|---|---|---|
| **User Authentication** | Fully Implemented & Tested | To be integrated | Browser manual test + JWT persistence check | Connect Registration & Login forms |
| **Profile Management** | Fully Implemented & Tested | To be integrated | Fetch profile & update phone/name | Connect Profile page |
| **Category Browsing & Admin CRUD** | Fully Implemented & Tested | To be integrated | Category dropdown & Admin table | Connect Category management |
| **Clothing Catalog & Filtering** | Core Implemented & Tested | To be integrated | Catalog search, size, color, price filters | Connect Catalog view (avoid date query params) |
| **Clothing Admin Management** | Partially Implemented | To be integrated | Add item & update price/metadata | Connect Admin clothing form (disable delete/reduction) |
| **Booking Creation** | Fully Implemented & Tested | To be integrated | Create booking & catch 409 overlap | Connect Date selection & Booking submission |
| **Booking History & Cancellation** | Fully Implemented & Tested | To be integrated | List my bookings & cancel action | Connect My Bookings page |
| **Payment (Electronic & Cash on Pickup)** | Fully Implemented & Tested | To be integrated | UPI simulation & Cash handover | Connect Checkout payment modal |
| **Refunds** | Fully Implemented & Tested | To be integrated | Admin refund on cancelled booking | Connect Admin refund button |
| **Return Processing** | Fully Implemented & Tested | To be integrated | Admin return form (fines calculated) | Connect Admin return modal |
| **Return Settlement** | Fully Implemented & Tested | To be integrated | Admin deposit settlement | Connect Admin settlement modal |
| **System Error Handling** | Fully Implemented & Tested | To be integrated | Toast / alert on API errors using `error.message` | Integrate Axios error interceptor |

---
*End of Handover Document.*  
*If any questions arise during frontend development, refer to `backend/docs/API_ENDPOINTS.md` and `backend/docs/CONTRACTS.md` or contact the backend team.*
