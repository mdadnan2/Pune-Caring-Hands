# Admin — Pune Caring Hands

## Phase 1 Admin Role

**Single admin role with full access.**

No role hierarchy, no permissions matrix in Phase 1.
All authenticated admins have access to all admin functionality.

---

## Implemented Booking Management

- Admin sign-in is at `/login`.
- Authenticated booking list at `/bookings` supports search by booking reference, patient name, or mobile number; status, appointment type, service, and appointment-date filters; and pagination.
- Authenticated booking detail is at `/bookings/:bookingRef`; payment proof and prescription are fetched through authenticated file routes.
- Payment verification and correction-request actions are available from booking detail.
- Confirmed bookings can be completed, cancelled, or rescheduled from booking detail. Cancellation releases and detaches its slot; rescheduling atomically reserves a future global slot and releases the previous one.
- Booking operation routes are `POST /api/v1/admin/bookings/:bookingRef/cancel`, `POST /api/v1/admin/bookings/:bookingRef/reschedule`, and `POST /api/v1/admin/bookings/:bookingRef/complete`. All require admin JWT authentication.
- Operational transitions are limited to `CONFIRMED → CANCELLED`, `CONFIRMED → RESCHEDULED`, and `CONFIRMED → COMPLETED`. Payment verification and correction transitions are also logged server-side. Payment records are unchanged by completion, cancellation, and rescheduling.
- The admin dashboard, service/pricing management, and patient management modules are implemented with the existing JWT guard.
- Patient alternate mobile, PIN code, Maps link, and gender are available from existing booking `serviceDetails` fields and do not require a Prisma schema change.

---

## Admin Authentication

- Login via email + password
- JWT token issued on successful login
- All admin routes protected by JWT guard
- See `instructions/authentication.md` for full auth rules

---

## Admin Modules

### Dashboard (`/dashboard`)

Metrics displayed:

- Total bookings (all time)
- Today's bookings
- Pending payment verification count
- Confirmed bookings count
- Service-wise booking counts (table or simple chart)
- Recent bookings (last 10, with status badges)

Keep dashboard simple — no complex analytics in Phase 1.

### Bookings (`/bookings`)

- List bookings
- Filter by: status, service, appointment date
- Click through to booking detail
- Booking detail shows: patient info, service details, slot, amount, payment status, and uploaded files

### Payment Verification (`/payments`)

- List bookings with status `PAYMENT_VERIFICATION`
- Show: booking ref, patient name, service, amount, and payment proof
- View payment proof through an authenticated backend file route
- Actions: Verify / Request correction (with required reason)
- After action: booking status updates accordingly

### Slots (`/slots`)

- View slots by date (calendar or date picker)
- Create new slots (date, start time, end time)
- Toggle slot availability
- View which booking is assigned to each slot

### Services & Pricing (`/services`)

- List all services
- Toggle service active/inactive
- Edit service description
- Manage `ServiceItem` records (for blood tests, X-ray types)
- Edit item names and prices

### Patients (`/patients`)

- List all patients
- Search by name or phone
- View patient detail: personal info, booking history

### Service Areas (`/service-areas`)

- List all PIN codes
- Add new PIN code + area name
- Toggle area active/inactive

### FAQs (`/faqs`)

- List all FAQs
- Create / edit / delete FAQs
- Reorder FAQs (sort order)
- Toggle active/inactive

### Testimonials (`/testimonials`)

- List all testimonials
- Create / edit / delete testimonials
- Toggle active/inactive
- Reorder

### Website Content (`/content`)

- Key-value editor for `WebsiteContent` records
- Edit: hero title, hero subtitle, about text, contact info, etc.
- Changes reflect on public website

### Settings (`/settings`)

- UPI ID and display name
- Basic application settings
- Admin profile (name, email, password change)

---

## Implemented Booking and Slot API Endpoints

All admin endpoints require the existing JWT guard and are under `/api/v1/admin/`:

```
POST   /auth/login
GET    /bookings?page=1&pageSize=20&search=...
GET    /bookings/:bookingRef
POST   /bookings/:bookingRef/cancel
POST   /bookings/:bookingRef/reschedule       { "slotId": "..." }
POST   /bookings/:bookingRef/complete
GET    /bookings/:bookingRef/files/:kind
PATCH  /payments/:paymentId/verify
PATCH  /payments/:paymentId/reject
GET    /slots
POST   /slots
PATCH  /slots/:id
DELETE /slots/:id
```

There is no generic booking status-update endpoint. Other admin modules listed above are planned and outside the implemented booking/slot-management slice.

---

## Admin UI Patterns

- Sidebar navigation (always visible on desktop)
- Page header with title and primary action button
- Data tables with pagination, filters, search
- Status badges using color-coded pills
- Confirmation dialogs for destructive actions
- Toast notifications for success/error feedback
- Loading skeletons for data fetching states

See `instructions/ui-design.md` for visual specifications.
