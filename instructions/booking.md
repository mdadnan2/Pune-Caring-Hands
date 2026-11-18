# Booking — Pune Caring Hands

## Booking Flow

```
Step 1: Service Selection
        ↓
Step 2: Patient Details
        (name, phone, email, address, DOB)
        ↓
Step 3: Service-Specific Details
        (varies by service — see below)
        ↓
Step 4: Date & Time Selection
        (slot selection or immediate request)
        ↓
Step 5: Review
        (summary of all details + price)
        ↓
Step 6: Payment
        (UPI QR code displayed)
        ↓
Step 7: Payment Proof
        (required screenshot upload; no transaction ID)
        ↓
Step 8: Verification
        (admin reviews payment proof)
        ↓
Step 9: Confirmation
        (booking reference shown)
```

---

## Booking Statuses

| Status                 | Meaning                                                                   |
| ---------------------- | ------------------------------------------------------------------------- |
| `REQUESTED`            | Legacy status; current booking creation does not emit it                  |
| `PAYMENT_PENDING`      | Booking created or payment correction requested; patient can submit proof |
| `PAYMENT_VERIFICATION` | Patient submitted payment proof; admin is reviewing it                    |
| `CONFIRMED`            | Admin verified payment                                                    |
| `CANCELLED`            | Confirmed booking cancelled by an admin                                   |
| `COMPLETED`            | Confirmed booking marked completed by an admin                            |
| `RESCHEDULED`          | Confirmed booking moved to a new slot by an admin                         |

The booking service explicitly creates bookings as `PAYMENT_PENDING`; it does not rely on the Prisma status default.

---

## Appointment Types

### IMMEDIATE

- Patient requests the earliest available doctor
- Does NOT guarantee immediate arrival
- No specific slot selected — admin assigns
- Only applicable to Doctor Home Consultation

### SCHEDULED

- Patient selects a specific date and time slot
- Slot must be available at time of booking
- Slot is reserved when booking is created

---

## Booking Creation Rules

1. Backend receives booking request
2. Backend validates service exists and is active
3. Backend validates patient's PIN code is in a supported service area
4. Backend calculates `totalAmount` from service/item prices — never from frontend
5. If SCHEDULED: backend checks slot availability inside a transaction
6. Backend creates `Booking` + `BookingItem` records + `Payment` record in a single transaction
7. Booking starts in `PAYMENT_PENDING` and its payment record starts in `PENDING`
8. Backend generates `bookingRef` (format: `PCH-YYYYMMDD-XXXX`)
9. Backend returns booking reference to frontend

---

## Price Verification

- Frontend displays prices fetched from the backend
- Frontend NEVER calculates or sends a price to the backend
- Backend recalculates the total from the selected service/items at booking time
- If prices have changed between page load and submission, backend uses current prices

---

## Service-Specific Fields

Stored in `Booking.serviceDetails` as JSON.

| Service                  | Required Fields                               |
| ------------------------ | --------------------------------------------- |
| Doctor Home Consultation | chiefComplaint, patientAge                    |
| ECG at Home              | patientAge                                    |
| Blood Test at Home       | selectedTestIds (array of ServiceItem IDs)    |
| X-Ray at Home            | selectedXrayTypeId (ServiceItem ID)           |
| Medicine Home Delivery   | prescriptionFileKey (uploaded file reference) |
| Online Consultation      | chiefComplaint, preferredLanguage             |

---

## Slot Rules

- Slots are created by admin in advance
- Each slot has a date, startTime, endTime
- One booking per slot (enforced at database level)
- Slot availability is checked inside a database transaction during booking creation
- A slot is marked unavailable once booked
- Admin can manually manage slot availability
- Cancelling a confirmed booking detaches it from and releases its slot atomically
- Rescheduling a confirmed booking atomically reserves a future available slot and releases its previous slot
- Completing a confirmed booking does not change its slot

---

## Patient Information

Captured during booking:

- Full name (required)
- Mobile number (required, Indian format)
- Email (optional)
- Complete address including PIN code (required)
- Date of birth (optional)
- Age at booking is snapshotted in `Booking.ageAtBooking`

Patient records are created or matched by phone number.
If a patient with the same phone number exists, the booking is linked to the existing patient record.

---

## Double-Booking Prevention

- Database unique constraint on `Slot.(date, startTime)`
- Booking creation uses a Prisma transaction
- Slot availability is checked and reserved atomically
- If slot is taken, return `SLOT_UNAVAILABLE` error

---

## Booking Reference Format

```
PCH-YYYYMMDD-XXXX
Example: PCH-20240315-0042
```

Generated by the backend. Never generated by the frontend.

---

## Confirmation

After successful booking creation:

- Frontend displays booking reference
- Frontend displays payment instructions (UPI QR)
- Patient proceeds to payment step
- Booking is not confirmed until an admin verifies the submitted payment proof

## Admin Booking Operations

Only authenticated admins can perform booking operations:

- Payment verification: `PAYMENT_VERIFICATION → CONFIRMED`
- Payment correction request: `PAYMENT_VERIFICATION → PAYMENT_PENDING`
- Completion: `CONFIRMED → COMPLETED`
- Cancellation: `CONFIRMED → CANCELLED`, with the slot released
- Rescheduling: `CONFIRMED → RESCHEDULED`, with the new slot reserved and previous slot released

`RESCHEDULED`, `CANCELLED`, and `COMPLETED` are not moved back to `CONFIRMED` through these operations. Payment records are not modified by completion, cancellation, or rescheduling.

---

## What NOT to Do

- Do NOT calculate prices on the frontend
- Do NOT trust slot availability from frontend state
- Do NOT create a booking without a corresponding Payment record
- Do NOT allow booking status to be set by the frontend
- Do NOT skip service area validation
