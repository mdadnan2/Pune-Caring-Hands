# Admin — Pune Caring Hands

## Phase 1 Admin Role

**Single admin role with full access.**

No role hierarchy, no permissions matrix in Phase 1.
All authenticated admins have access to all admin functionality.

---

## Implemented Phase 2A/2B Booking Slice

- Admin sign-in is at `/login`.
- Authenticated booking list at `/bookings` supports status, service, and appointment-date filters.
- Authenticated booking detail is at `/bookings/:bookingRef`; payment proof and prescription are fetched through authenticated file routes.
- Payment verification and correction-request actions are available from booking detail.
- Other admin modules described below remain outside this Phase 2A/2B implementation.

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

## Admin API Endpoints (to be implemented)

All under `/api/v1/admin/`:

```
POST   /auth/login
GET    /dashboard/stats
GET    /bookings
GET    /bookings/:id
PATCH  /bookings/:id/status
GET    /payments/pending
PATCH  /payments/:id/verify
PATCH  /payments/:id/reject
GET    /slots
POST   /slots
PATCH  /slots/:id
DELETE /slots/:id
GET    /services
PATCH  /services/:id
GET    /services/:id/items
POST   /services/:id/items
PATCH  /service-items/:id
DELETE /service-items/:id
GET    /patients
GET    /patients/:id
GET    /service-areas
POST   /service-areas
PATCH  /service-areas/:id
DELETE /service-areas/:id
GET    /faqs
POST   /faqs
PATCH  /faqs/:id
DELETE /faqs/:id
GET    /testimonials
POST   /testimonials
PATCH  /testimonials/:id
DELETE /testimonials/:id
GET    /content
PATCH  /content/:key
GET    /settings
PATCH  /settings
```

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
