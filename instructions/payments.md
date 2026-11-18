# Payments — Pune Caring Hands

## Phase 2A Payment Flow

**UPI QR code + manual admin verification.** No payment gateway is used.

```
Booking created (PAYMENT_PENDING)
        ↓
Backend creates a PENDING payment using its calculated booking amount
        ↓
Patient pays using the UPI instructions / QR
        ↓
Patient submits a required payment screenshot (no transaction ID)
        ↓
Payment → SUBMITTED; booking → PAYMENT_VERIFICATION
        ↓
Authenticated admin reviews the proof
       ↙ ↘
Verify   Request correction with reason
  ↓               ↓
Booking        Payment → REJECTED
CONFIRMED      Booking → PAYMENT_PENDING
               (patient can resubmit proof)
```

Uploading proof never confirms a booking. Only an authenticated admin can verify payment and move the booking to `CONFIRMED`.

## Amount and UPI Configuration

- `Payment.amount` is copied from backend-calculated `Booking.totalAmount`.
- The public payment page reads the saved booking amount; it never submits a price.
- Configure `UPI_ID` and `UPI_NAME` in environment variables.
- The public instructions endpoint returns only the UPI ID and payee name.
- The QR uses the UPI deep-link format with the saved amount and booking reference.

## Payment Statuses

| Status | Meaning |
| --- | --- |
| `PENDING` | Payment record exists; proof has not been submitted |
| `SUBMITTED` | Patient submitted a payment screenshot |
| `VERIFIED` | Admin verified the payment |
| `REJECTED` | Admin requested correction and recorded a reason |

`Payment.upiTransactionId` remains in the database for compatibility but is not accepted or displayed in the patient flow.

## Proof Upload and Access

- Accepted formats: JPEG, PNG, and PDF, validated by content signature.
- Maximum size: 5MB, enforced by the multipart endpoint and upload service.
- The patient submits the file as `proof` in `multipart/form-data`.
- The database stores only the generated storage key.
- Payment proofs and medicine prescriptions are returned only through authenticated admin booking file routes; raw keys and public file URLs are not exposed.

## Admin Actions

- `PATCH /api/v1/admin/payments/:paymentId/verify` atomically marks payment `VERIFIED` and booking `CONFIRMED`.
- `PATCH /api/v1/admin/payments/:paymentId/reject` requires a correction reason, marks payment `REJECTED`, and returns the booking to `PAYMENT_PENDING`.
- Both operations verify the current state and update the booking and payment in one database transaction.

No automatic payment gateway, automatic confirmation, or patient transaction-ID collection is implemented.
