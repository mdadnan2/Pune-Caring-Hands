# Project Features — Pune Caring Hands (Phase 1)

## Services

### 1. Doctor Home Consultation

- Base price: ₹1,500
- Fixed price — no sub-items
- Appointment type: IMMEDIATE or SCHEDULED
- IMMEDIATE = earliest available doctor request (does NOT guarantee immediate arrival)
- Service-specific fields: chief complaint, patient age, any known conditions

### 2. ECG at Home

- Base price: ₹700
- Fixed price
- Appointment type: SCHEDULED
- Service-specific fields: patient age, any cardiac history (optional)

### 3. Blood Test at Home

- Pricing: test-wise (each test has its own price via `ServiceItem`)
- Patient selects one or more tests
- Total calculated by backend based on selected `ServiceItem` IDs
- Appointment type: SCHEDULED
- Service-specific fields: selected tests, fasting status

### 4. X-Ray at Home

- Pricing: type-wise (each X-ray type has its own price via `ServiceItem`)
- Patient selects one X-ray type
- Appointment type: SCHEDULED
- Service-specific fields: body part / X-ray type, doctor referral (optional)

### 5. Medicine Home Delivery

- Target pricing: prescription-based, with an admin price set after prescription review
- Patient uploads prescription
- Appointment type: SCHEDULED (delivery slot)
- Service-specific fields: prescription upload, notes
- The current booking flow uses the backend-configured service price; if no price is configured, the amount is ₹0. A post-review price adjustment is not implemented.
- Booking starts as `PAYMENT_PENDING`, with a `PENDING` payment record.

### 6. Online Consultation

- Base price: ₹500
- Fixed price
- Appointment type: SCHEDULED
- Service-specific fields: chief complaint, preferred language

---

## IMPORTANT: No "Consultation With Medicines" Service

Do NOT create a combined "Consultation With Medicines" service.
Medicine delivery is a separate service.
Patients who want both must book separately.

---

## Public Website Pages

| Page           | Path                              | Description                                                    |
| -------------- | --------------------------------- | -------------------------------------------------------------- |
| Home           | `/`                               | Hero, services overview, how it works, testimonials, FAQs, CTA |
| Services       | `/services`                       | All services listing                                           |
| Service Detail | `/services/[slug]`                | Individual service page with pricing and booking CTA           |
| About          | `/about`                          | About Pune Caring Hands                                        |
| Contact        | `/contact`                        | Contact form + WhatsApp link + address                         |
| FAQs           | `/faqs`                           | Frequently asked questions                                     |
| Testimonials   | `/testimonials`                   | Patient testimonials                                           |
| Service Areas  | `/service-areas`                  | Pune areas covered                                             |
| Booking        | `/book`                           | Multi-step booking flow                                        |
| Confirmation   | `/book/confirmation/[bookingRef]` | Booking confirmation page                                      |
| Privacy Policy | `/privacy`                        | Privacy policy                                                 |
| Terms          | `/terms`                          | Terms of service                                               |

---

## Booking Flow

```
Step 1: Service Selection
Step 2: Patient Details
Step 3: Service-Specific Details
Step 4: Date & Time Selection
Step 5: Review
Step 6: Payment (UPI QR)
Step 7: Required payment proof upload (no transaction ID)
Step 8: Admin payment verification
Step 9: Confirmation
```

See `instructions/booking.md` for detailed booking rules.

---

## Admin Modules

| Module               | Path             | Description                          |
| -------------------- | ---------------- | ------------------------------------ |
| Login                | `/login`         | Admin authentication                 |
| Dashboard            | `/dashboard`     | Overview metrics and recent bookings |
| Bookings             | `/bookings`      | All bookings with filters            |
| Booking Detail       | `/bookings/[id]` | Full booking details                 |
| Payment Verification | `/payments`      | Pending payment verification queue   |
| Slots                | `/slots`         | Create and manage appointment slots  |
| Services             | `/services`      | Manage services and pricing          |
| Patients             | `/patients`      | Patient records                      |
| Service Areas        | `/service-areas` | Manage Pune PIN codes                |
| FAQs                 | `/faqs`          | Manage FAQ content                   |
| Testimonials         | `/testimonials`  | Manage testimonials                  |
| Website Content      | `/content`       | Edit key website content             |
| Settings             | `/settings`      | Basic application settings           |

---

## Phase 1 Exclusions

The following are explicitly OUT OF SCOPE for Phase 1:

- Patient accounts / login / dashboard
- Automatic doctor assignment
- Automatic technician assignment
- Pharmacy management
- Laboratory management
- Radiologist management
- Complex CRM
- Advanced analytics / reporting
- Automated operational workflows
- WhatsApp Cloud API (manual WhatsApp link is fine)
- Payment gateway (Razorpay etc.)
- GPS / radius-based service availability
- Cancellation / rescheduling workflow
- Medical report management
- Multi-city support
- Microservices
