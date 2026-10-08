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
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── validators/
│   ├── utils/
│   ├── app.js
│   └── server.js
│
├── tests/
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
6. Authentication & Middleware
7. Admin authorization
8. Category model and CRUD
9. Clothing model and CRUD
10. Availability service
11. Booking model and booking service
12. Payment simulation
13. Return management & Fine calculation
14. Notification/reminder system
15. Admin dashboard endpoints
16. Frontend integration
