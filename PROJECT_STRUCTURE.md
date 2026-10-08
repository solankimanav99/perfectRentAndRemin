# Project Structure 📁

## Overview

The project follows a clean **client-server architecture** with the frontend and backend in separate folders. This makes the code organized, maintainable, and easy to explain during viva.

---

## Complete Folder Structure

```
PerfectRentAndRemind/
│
├── README.md
├── PROJECT_STRUCTURE.md
├── DATABASE_DESIGN.md
├── API_ENDPOINTS.md
├── FEATURES.md
├── .gitignore
│
├── backend/                        # Node.js + Express API Server
│   ├── package.json
│   ├── .env                        # Environment variables (not committed)
│   ├── .env.example                # Template for .env
│   ├── server.js                   # Entry point — starts Express server
│   │
│   ├── config/
│   │   └── db.js                   # MongoDB connection setup
│   │
│   ├── models/                     # Mongoose schemas/models
│   │   ├── User.js
│   │   ├── Category.js
│   │   ├── Clothing.js
│   │   ├── Booking.js
│   │   ├── Payment.js
│   │   ├── Return.js
│   │   └── Notification.js
│   │
│   ├── routes/                     # Express route definitions
│   │   ├── authRoutes.js
│   │   ├── clothingRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── returnRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── adminRoutes.js
│   │   └── dashboardRoutes.js
│   │
│   ├── controllers/                # Request handlers (business logic)
│   │   ├── authController.js
│   │   ├── clothingController.js
│   │   ├── categoryController.js
│   │   ├── bookingController.js
│   │   ├── paymentController.js
│   │   ├── returnController.js
│   │   ├── notificationController.js
│   │   ├── adminController.js
│   │   └── dashboardController.js
│   │
│   ├── middleware/                  # Express middleware
│   │   ├── authMiddleware.js        # JWT verification
│   │   ├── adminMiddleware.js       # Admin role check
│   │   └── errorMiddleware.js       # Global error handler
│   │
│   ├── utils/                       # Helper/utility functions
│   │   ├── fineCalculator.js        # Late fine calculation logic
│   │   └── reminderGenerator.js     # Reminder message generation
│   │
│   └── seed/                        # Optional seed data
│       └── seedData.js              # Sample clothes, categories
│
│
├── frontend/                        # React Application
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   │
│   └── src/
│       ├── index.js                 # React entry point
│       ├── App.js                   # Main app with routing
│       ├── App.css                  # Global styles
│       │
│       ├── components/              # Reusable UI components
│       │   ├── Navbar.jsx
│       │   ├── Footer.jsx
│       │   ├── ClothingCard.jsx
│       │   ├── BookingCard.jsx
│       │   ├── SearchBar.jsx
│       │   ├── FilterPanel.jsx
│       │   ├── ReminderBadge.jsx
│       │   ├── Chatbot.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── Loader.jsx
│       │
│       ├── pages/                   # Full page components
│       │   ├── customer/
│       │   │   ├── Home.jsx
│       │   │   ├── Login.jsx
│       │   │   ├── Register.jsx
│       │   │   ├── ClothingList.jsx
│       │   │   ├── ClothingDetail.jsx
│       │   │   ├── BookingPage.jsx
│       │   │   ├── MyBookings.jsx
│       │   │   ├── BookingDetail.jsx
│       │   │   ├── Profile.jsx
│       │   │   └── Notifications.jsx
│       │   │
│       │   └── admin/
│       │       ├── AdminLogin.jsx
│       │       ├── Dashboard.jsx
│       │       ├── ManageClothing.jsx
│       │       ├── ManageCategories.jsx
│       │       ├── ManageBookings.jsx
│       │       ├── ManagePayments.jsx
│       │       ├── ManageReturns.jsx
│       │       ├── ManageCustomers.jsx
│       │       └── Reports.jsx
│       │
│       ├── context/                 # React Context for state
│       │   └── AuthContext.jsx      # Auth state (user, token, role)
│       │
│       ├── services/                # API call functions
│       │   ├── api.js               # Axios instance with base URL
│       │   ├── authService.js
│       │   ├── clothingService.js
│       │   ├── bookingService.js
│       │   ├── paymentService.js
│       │   └── adminService.js
│       │
│       └── utils/                   # Frontend helpers
│           ├── formatDate.js
│           ├── formatCurrency.js
│           └── constants.js         # Booking statuses, categories, etc.
│
└── .gitignore
```

---

## Key Architecture Decisions

| Decision | Reason |
|----------|--------|
| **Separate `frontend/` and `backend/` folders** | Clean separation of concerns; easy to explain in viva |
| **Models folder (Mongoose schemas)** | MongoDB needs defined schemas for data validation |
| **Controllers handle business logic** | Keeps routes thin and logic testable |
| **Middleware for auth** | Reusable across all protected routes |
| **`services/` in frontend** | Centralizes all API calls in one place |
| **`context/` for auth state** | Avoids prop drilling for user/token across components |
| **`utils/` in both** | Shared helper functions (date formatting, fine calc, etc.) |

---

## Request Flow

```
User Action (React Component)
  → Service Function (API call)
  → Express Route
  → Middleware (auth check)
  → Controller (business logic)
  → Mongoose Model (database)
  → Response back to React
```

---

## Notes

- Files will be created **step-by-step** during development, not all at once.
- This structure may evolve slightly as features are added.
- The `seed/` folder is optional — used to populate sample data for testing.
