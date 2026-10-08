# API Endpoints 🔌

**Base URL:** `http://localhost:5000/api`

Protected routes require: `Authorization: Bearer <token>`

---

## Response Format

**Success:**
```json
{ "success": true, "data": { } }
```

**Error:**
```json
{ "success": false, "message": "Human readable error message" }
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Failed |
| 401 | Not Authenticated |
| 403 | Forbidden (not authorized) |
| 404 | Not Found |
| 409 | Conflict (e.g., email already exists) |
| 500 | Server Error |

---

## 1. Authentication APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register a new customer |
| POST | `/api/auth/login` | No | Login (customer or admin) |
| GET | `/api/auth/me` | Yes | Get current logged-in user profile |
| PUT | `/api/auth/profile` | Yes | Update profile |

### POST /api/auth/register
**Body:**
```json
{
  "name": "Manav",
  "email": "manav@example.com",
  "password": "password123",
  "phone": "9876543210"
}
```
**Success 201:**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "name": "Manav", "email": "manav@example.com", "role": "customer" },
    "token": "jwt_token_here"
  }
}
```

### POST /api/auth/login
**Body:**
```json
{ "email": "manav@example.com", "password": "password123" }
```
**Success 200:** Same format as register response.

---

## 2. Clothing APIs (Public + Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/clothes` | No | Browse all available clothes |
| GET | `/api/clothes/:id` | No | Get single clothing details |
| GET | `/api/clothes/:id/availability` | No | Check availability for dates |
| POST | `/api/clothes` | Admin | Add new clothing item |
| PUT | `/api/clothes/:id` | Admin | Update clothing item |
| DELETE | `/api/clothes/:id` | Admin | Delete clothing item |

**Query Parameters for GET /api/clothes (all optional):**
- `q` — Search by name
- `category` — Filter by category ID
- `size` — Filter by size
- `color` — Filter by color
- `minPrice` / `maxPrice` — Price range
- `sort` — `price_asc`, `price_desc`, `newest`
- `page` / `limit` — Pagination

---

## 3. Category APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | No | Get all categories |
| POST | `/api/categories` | Admin | Add new category |
| PUT | `/api/categories/:id` | Admin | Update category |
| DELETE | `/api/categories/:id` | Admin | Delete category |

---

## 4. Booking APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bookings` | Customer | Create new booking |
| GET | `/api/bookings/my` | Customer | Get customer's bookings |
| GET | `/api/bookings/:id` | Customer | Get booking details |
| PUT | `/api/bookings/:id/cancel` | Customer | Cancel a booking |
| GET | `/api/bookings` | Admin | Get all bookings |
| PUT | `/api/bookings/:id/status` | Admin | Update booking status |

### POST /api/bookings
**Body:**
```json
{
  "clothingId": "clothing_object_id",
  "quantity": 1,
  "rentalStartDate": "2026-10-15",
  "returnDate": "2026-10-20"
}
```

---

## 5. Payment APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments` | Customer | Create/simulate payment |
| GET | `/api/payments/booking/:bookingId` | Customer | Get payment for a booking |
| GET | `/api/payments` | Admin | Get all payments |
| PUT | `/api/payments/:id/status` | Admin | Update payment status |

---

## 6. Return APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/returns` | Admin | Process a return |
| GET | `/api/returns` | Admin | Get all returns |
| GET | `/api/returns/:bookingId` | Customer/Admin | Get return details |

---

## 7. Notification APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | Customer | Get notifications |
| GET | `/api/notifications/unread-count` | Customer | Get unread count |
| PUT | `/api/notifications/:id/read` | Customer | Mark as read |
| PUT | `/api/notifications/read-all` | Customer | Mark all as read |

---

## 8. Admin Dashboard APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard/stats` | Admin | Get dashboard statistics |
| GET | `/api/dashboard/charts` | Admin | Get chart data |

---

## Route Protection Summary

| Route Group | Access |
|-------------|--------|
| Auth (register/login) | Public |
| Clothing browsing | Public |
| Categories listing | Public |
| Booking creation/viewing | Authenticated Customer |
| Payment creation | Authenticated Customer |
| Notifications | Authenticated Customer |
| All admin routes | Authenticated Admin only |

---

## Middleware Chain

```
Public Route:    Request → Controller → Response
Customer Route:  Request → authMiddleware → Controller → Response
Admin Route:     Request → authMiddleware → adminMiddleware → Controller → Response
```
