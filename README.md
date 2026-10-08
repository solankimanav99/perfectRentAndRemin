# Perfect Rent & Remind 👗

### Smart Clothing Rental Management System

A full-stack web application that digitizes and simplifies the complete clothing rental process for customers and administrators. Built as a 5th-semester Advanced Web Technology (AWT) college project.

---

## 🎯 Project Purpose

Perfect Rent & Remind is designed for a real-world clothing rental business. It allows:
- **Customers** to browse, search, book, and return rental clothing with automated reminders.
- **Admins** to manage inventory, bookings, payments, returns, late fines, and view business analytics.

The **unique feature** is the **"Remind" system** — customers receive in-app notifications before their rental return date to avoid late fines.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js, JavaScript, HTML, CSS, React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Authentication | JWT, bcryptjs |
| Charts | Recharts / Chart.js |
| Dev Tools | VS Code, Git/GitHub, Postman |

---

## 👥 Target Users

### Customer
- Register / Login / Logout
- Browse, search, and filter clothes
- View clothing details and check availability
- Select rental dates and book clothes
- View booking history and track status
- View payment information
- Receive return reminders
- Use support chatbot

### Admin
- Secure admin login
- Dashboard with analytics
- Manage clothing inventory (CRUD)
- Manage categories, customers, bookings
- Manage payments, returns, and late fines
- View reports and charts

---

## 🏗️ Architecture

```
Customer / Admin
      ↓
React Frontend (Port 3000)
      ↓
REST API
      ↓
Node.js + Express (Port 5000)
      ↓
MongoDB
```

---

## 📂 Project Documentation

| Document | Description |
|----------|-------------|
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Folder structure for frontend and backend |
| [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) | MongoDB collections and schema design |
| [API_ENDPOINTS.md](./API_ENDPOINTS.md) | All REST API routes and contracts |
| [FEATURES.md](./FEATURES.md) | Feature list with priority levels |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Git

### Installation

**1. Clone the repository**
```bash
git clone <repo-url>
cd PerfectRentAndRemind
```

**2. Setup Backend**
```bash
cd backend
npm install
# Create .env file (see .env.example)
npm run dev
```

**3. Setup Frontend**
```bash
cd frontend
npm install
npm start
```

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/perfect_rent
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

---

## 📊 Core Workflow

```
Customer Registration/Login
  → Browse Clothes
  → Search/Filter
  → View Details
  → Select Rental Dates
  → Check Availability
  → Book
  → Payment
  → Pickup
  → Rental Period
  → Return Reminder
  → Return
  → Fine Calculation (if late)
  → Booking Completion
```

---

## 🧠 AWT Concepts Demonstrated

- HTML, CSS, JavaScript
- React (Components, Props, State, Forms, Router)
- REST APIs (CRUD operations)
- Node.js + Express.js
- MongoDB (Database operations)
- Authentication & Authorization (JWT)
- Responsive Web Design
- Form Validation
- Charts & Analytics

---

## 📝 License

This project is developed for educational purposes as part of the 5th-semester AWT curriculum.

---

**Developed by:** Manav
