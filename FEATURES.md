# Features List ✅

Features organized by priority. **P0 = Must Have**, **P1 = Nice to Have**, **P2 = Future**.

---

## 🔴 P0 — Core Features (Must Have)

### Authentication & Authorization
- [ ] Customer registration with form validation
- [ ] Customer login/logout with JWT
- [ ] Admin login with separate secure route
- [ ] Password hashing with bcryptjs
- [ ] Protected routes (customer and admin)
- [ ] Role-based access control
- [ ] Profile management

### Clothing Management (Admin)
- [ ] Add new clothing item
- [ ] Edit clothing item
- [ ] Delete clothing item
- [ ] Manage categories (CRUD)
- [ ] Track inventory (total vs available quantity)

### Clothing Browsing (Customer)
- [ ] Browse all available clothes
- [ ] View clothing details page
- [ ] Search by name/keyword
- [ ] Filter by category, size, color, price range
- [ ] Sort by price, newest
- [ ] Pagination
- [ ] Check availability for dates

### Booking System
- [ ] Select clothing, dates, quantity
- [ ] Auto-calculate rental amount
- [ ] Prevent double booking
- [ ] View booking history & details
- [ ] Track booking status
- [ ] Cancel booking
- [ ] Admin: Confirm/update status

### Payment System (Simulated)
- [ ] Create payment for booking
- [ ] Select method (UPI/Card/Cash)
- [ ] Payment status tracking
- [ ] Admin: Manage payments

### Return Management
- [ ] Process return (Admin)
- [ ] Auto-calculate late days & fine
- [ ] Record clothing condition
- [ ] Admin: View all returns

### Reminder System
- [ ] 3 days before return reminder
- [ ] 1 day before return reminder
- [ ] Due date reminder
- [ ] Overdue notification
- [ ] Notification bell with unread count
- [ ] Mark as read

### Admin Dashboard
- [ ] Stats cards (customers, items, rentals, revenue)
- [ ] Monthly bookings chart
- [ ] Monthly revenue chart
- [ ] Most rented clothing chart
- [ ] Category-wise rentals chart

### UI/UX
- [ ] Clean, professional design
- [ ] Responsive layout
- [ ] Loading states & error handling
- [ ] Form validation

---

## 🟡 P1 — Extra Features (After Core)

- [ ] Rule-based FAQ chatbot
- [ ] Wishlist
- [ ] Reviews & Ratings
- [ ] Advanced analytics

---

## 🟢 P2 — Future Enhancements

- [ ] Email/SMS notifications
- [ ] Real payment gateway
- [ ] AI clothing recommendations
- [ ] Invoice PDF generation

---

## Development Order

```
 1. Project Setup
 2. MongoDB Connection
 3. Authentication
 4. Admin Auth
 5. Categories
 6. Clothing Management
 7. Clothing Browsing
 8. Search & Filter
 9. Availability Check
10. Booking System
11. Payment Simulation
12. Return Management
13. Late Fine Calculation
14. Reminder System
15. Admin Dashboard
16. UI Polish
--- Core Complete ---
17. Chatbot
18. Wishlist / Reviews
```

---

## AWT Concepts Coverage

| Concept | Where Used |
|---------|------------|
| HTML/CSS | React JSX, styling |
| JavaScript | Frontend + backend logic |
| React Components | Navbar, ClothingCard, etc. |
| Props & State | Data passing, form management |
| React Router | Page navigation |
| REST APIs | All CRUD endpoints |
| Node.js + Express | Backend server |
| MongoDB | 7 collections |
| JWT Auth | Login, protected routes |
| Form Validation | Registration, booking |
| Responsive Design | Mobile + desktop |
| Charts | Admin dashboard |
