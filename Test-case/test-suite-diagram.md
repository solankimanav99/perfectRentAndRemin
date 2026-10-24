# Perfect Rent & Remind – Test Suite Architecture Diagram
**Course:** Advanced Web Technologies (AWT) – Practical 9  
**Application:** Perfect Rent & Remind – Smart Clothing Rental Management System  
**Test Harness:** Jest v30, Supertest v7, MongoMemoryReplSet v11  

---

## 1. Architectural Overview of Test Suites

The automated testing architecture for **Perfect Rent & Remind** is structured into a multi-tier hierarchy reflecting the Testing Pyramid:
1. **Tier 1: Unit & Domain Logic Testing:** Focuses on pure algorithmic calculations (`calculateRental.js`, `calculateFine.js`, `generateToken.js`, Joi schemas) without external I/O.
2. **Tier 2: Middleware & Security Boundary Testing:** Exercises token validation, role-based authorization guards (`protect`, `admin`), rate limiting, and centralized error handling in isolation.
3. **Tier 3: Domain Service & Concurrency Testing:** Validates transactional multi-document workflows, version-bump optimistic concurrency protocols, atomic inventory reservation, and rollback semantics in `booking.service.js` and `payment.service.js`.
4. **Tier 4: REST API Integration Testing:** Full HTTP request/response validation over Supertest across all functional domains (`/api/auth`, `/api/users`, `/api/categories`, `/api/clothing`, `/api/bookings`, `/api/payments`, `/api/returns`).
5. **Tier 5: System End-to-End Integration Testing:** Complete multi-step user journeys executing stateful lifecycles across bookings, atomic payments, cash collections, physical returns, and financial settlements.

---

## 2. Test Suite Architecture Diagram (Mermaid)

```mermaid
graph TD
    subgraph Client_Layer ["Client & Test Harness Layer"]
        CLI["Jest Test Runner (CLI / npm test)"]
        SUPERTEST["Supertest (HTTP Agent)"]
        ISTANBUL["Istanbul Code Coverage Reporter"]
    end

    subgraph Test_Suites ["Automated Test Suites (backend/tests)"]
        TS_AUTH["auth.test.js (10 Tests)<br/>Registration, Login, Token Claims"]
        TS_USER["user.test.js & profile.test.js (9 Tests)<br/>Profile Fetch, Profile Update"]
        TS_CAT["category.test.js (9 Tests)<br/>Category CRUD, Unique Names"]
        TS_CLOTH["clothing.test.js (10 Tests)<br/>Catalog Discovery, Filter Queries"]
        TS_BOOK["booking.test.js (15 Tests)<br/>Reservation, Dates, Overlaps"]
        TS_PAY["payment.test.js (13 Tests)<br/>Electronic UPI, Cash on Pickup"]
        TS_RET["return.test.js (9 Tests)<br/>Returns, Late Fines, Settle"]
        TS_MID["middleware.test.js (3 Tests)<br/>Token Extract, Admin Guard"]
        TS_E2E["e2e.integration.test.js (8 Tests)<br/>Full Cross-Module User Journeys"]
    end

    subgraph Application_Layer ["Backend Application Modules (backend/src)"]
        APP["Express 5 App (src/app.js)"]
        MID["Middleware (Auth, RateLimiter, ErrorHandler)"]
        ROUTES["API Routers (auth, users, categories, clothing, bookings, payments, returns)"]
        CTRL["Controllers (auth, user, category, clothing, booking, payment, return)"]
        SRV["Business Services (booking.service, payment.service)"]
        UTILS["Utilities (calculateRental, calculateFine, transactionHelper)"]
        MODELS["Mongoose ODM Models (User, Category, Clothing, Booking, Payment, Return)"]
    end

    subgraph Database_Layer ["Isolated Data & Transaction Tier"]
        MMS["MongoMemoryReplSet (In-Memory Daemon)"]
        REPL["Replica Set Support (Multi-Document Transactions)"]
        COLL_USER[("Users Collection")]
        COLL_CAT[("Categories Collection")]
        COLL_CLOTH[("Clothing Collection")]
        COLL_BOOK[("Bookings Collection")]
        COLL_PAY[("Payments Collection (Unique bookingId)")]
        COLL_RET[("Returns Collection")]
    end

    %% Linkages
    CLI --> SUPERTEST
    CLI --> ISTANBUL
    SUPERTEST --> TS_AUTH
    SUPERTEST --> TS_USER
    SUPERTEST --> TS_CAT
    SUPERTEST --> TS_CLOTH
    SUPERTEST --> TS_BOOK
    SUPERTEST --> TS_PAY
    SUPERTEST --> TS_RET
    SUPERTEST --> TS_MID
    SUPERTEST --> TS_E2E

    TS_AUTH --> APP
    TS_USER --> APP
    TS_CAT --> APP
    TS_CLOTH --> APP
    TS_BOOK --> APP
    TS_PAY --> APP
    TS_RET --> APP
    TS_MID --> APP
    TS_E2E --> APP

    APP --> MID
    MID --> ROUTES
    ROUTES --> CTRL
    CTRL --> SRV
    CTRL --> UTILS
    SRV --> UTILS
    CTRL --> MODELS
    SRV --> MODELS

    MODELS --> REPL
    REPL --> MMS
    MMS --> COLL_USER
    MMS --> COLL_CAT
    MMS --> COLL_CLOTH
    MMS --> COLL_BOOK
    MMS --> COLL_PAY
    MMS --> COLL_RET

    ISTANBUL -. Collects Metrics .-> APP
    ISTANBUL -. Collects Metrics .-> CTRL
    ISTANBUL -. Collects Metrics .-> SRV
    ISTANBUL -. Collects Metrics .-> UTILS
    ISTANBUL -. Collects Metrics .-> MID
```

---

## 3. Test Suite Mapping & Execution Matrix

| Test Suite | Testing Level | Modules Covered | Primary Source Files Tested | Test Case IDs Covered | Execution Status |
|:---|:---:|:---|:---|:---|:---:|
| **Authentication & User Profile Suite** | Integration & Security | User onboarding, authentication, JWT tokens, profile editing | `src/controllers/auth.controller.js`<br>`src/controllers/user.controller.js`<br>`src/middleware/auth.middleware.js` | TC-01-P01 to P03<br>TC-01-N01 to N04<br>TC-02-N01 to N02 | **Pass** (19/19 tests) |
| **Category & Clothing Inventory Suite** | Integration & Contract | Inventory management, category CRUD, public search, query filtering | `src/controllers/category.controller.js`<br>`src/controllers/clothing.controller.js`<br>`src/models/Clothing.js` | TC-02-P01, TC-02-N03<br>TC-03-P01 to P03<br>TC-03-N01 to N04 | **Pass** (19/19 tests) *(Includes 4 passing 501 defensive guard tests)* |
| **Booking Lifecycle & Concurrency Suite** | Integration & Transaction | Date validation, rental calculations, inventory reservation, cancellation | `src/services/booking.service.js`<br>`src/controllers/booking.controller.js`<br>`src/utils/calculateRental.js` | TC-04-P01 to P03<br>TC-04-N01 to N04<br>TC-05-P01 to P02<br>TC-06-P01 to P03 | **Pass** (15/15 tests) *(Updated with dynamic future date fixtures)* |
| **Payment & Refund Transaction Suite** | Integration & Transaction | Electronic checkout, Cash on Pickup, atomic booking confirmation, refunds | `src/services/payment.service.js`<br>`src/controllers/payment.controller.js`<br>`src/models/Payment.js` | TC-07-P01 to P03<br>TC-08-P01 to P03<br>TC-09-P01, TC-09-N01<br>TC-10-P01, TC-10-N01 | **Pass** (13/13 tests) |
| **Return Processing & Settlement Suite** | Integration & Calculation | Return intake, calendar-day fine calculation, deposit deductions, completion | `src/controllers/return.controller.js`<br>`src/utils/calculateFine.js`<br>`src/models/Return.js` | TC-11-P01 to P03<br>TC-11-N01 to N03<br>TC-12-P01 to P02<br>TC-12-N01 to N03 | **Pass** (9/9 tests) |
| **Middleware & Rate Limiting Suite** | Unit & Middleware | Token extraction, role verification, rate limiting | `src/middleware/auth.middleware.js`<br>`src/middleware/rateLimiter.middleware.js` | TC-02-N01 to N04 | **Pass** (3/3 tests) |
| **End-to-End System Integration Suite** | System / E2E | Cross-module customer & admin journeys from booking through settlement | Full application stack integrated (`app.js`, services, transactions) | All scenarios validated in sequence | **Pass** (8/8 tests) |

---

## 4. Key Architectural Patterns in Test Design
1. **Dynamic Ephemeral Data Isolation:** Each test suite boots an isolated in-memory MongoDB replica set via `MongoMemoryReplSet.create()`, ensuring zero database persistence between runs and preventing cross-suite data pollution.
2. **Atomic Transaction Simulation:** By leveraging `MongoMemoryReplSet`, the test suites execute genuine multi-document MongoDB transactions (`session.withTransaction()`), validating commit and rollback semantics under real database guarantees.
3. **Automated Teardown Fixtures:** Standardized `beforeEach` and `afterEach` hooks execute `deleteMany({})` across all collections, ensuring that individual test assertions begin with a pristine database state.
