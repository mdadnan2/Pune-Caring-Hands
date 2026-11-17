# Validation — Pune Caring Hands

## Principle

**Validate on both frontend AND backend.**

Frontend validation improves UX.
Backend validation enforces correctness and security.
Never rely on frontend validation alone for business-critical rules.

---

## Frontend Validation

**Stack:** React Hook Form + Zod + @hookform/resolvers

### Pattern

```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const patientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().min(10, 'Enter your complete address'),
  pinCode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
});

const form = useForm<z.infer<typeof patientSchema>>({
  resolver: zodResolver(patientSchema),
});
```

### Rules

- Define schemas in `features/<feature>/schemas/`
- Show field-level error messages below each input
- Disable submit button while form is submitting
- Re-validate on blur for better UX

---

## Backend Validation

**Stack:** class-validator + class-transformer + NestJS ValidationPipe

### Pattern

```typescript
import { IsString, IsUUID, IsOptional, MinLength, Matches } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  serviceId: string;

  @IsString()
  @MinLength(2)
  patientName: string;

  @Matches(/^[6-9]\d{9}$/, { message: 'Invalid Indian mobile number' })
  patientPhone: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

### Global ValidationPipe (configured in main.ts)

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // strip unknown properties
    forbidNonWhitelisted: true, // reject requests with unknown properties
    transform: true, // auto-transform types
  }),
);
```

---

## Fields That Must NEVER Be Trusted from Frontend

| Field                      | Reason                                        |
| -------------------------- | --------------------------------------------- |
| `totalAmount` / `price`    | Backend calculates from service/item records  |
| `status` (booking/payment) | Backend controls all status transitions       |
| `role` / `permissions`     | Backend derives from JWT and database         |
| `slotAvailability`         | Backend checks atomically in transaction      |
| `serviceIsActive`          | Backend validates against database            |
| `areaIsSupported`          | Backend validates against ServiceArea records |

---

## Phone Number Validation

Indian mobile numbers:

- 10 digits
- Starts with 6, 7, 8, or 9
- Regex: `/^[6-9]\d{9}$/`

---

## PIN Code Validation

- 6 digits
- Regex: `/^\d{6}$/`
- Backend additionally checks against `ServiceArea` table

---

## File Upload Validation

Backend validates:

- MIME type: `image/jpeg`, `image/png`, `application/pdf`
- File size: maximum 5MB
- File is not empty

---

## Date/Time Validation

- Dates must be in the future for new bookings
- Slot date must be a valid calendar date
- Time format: `HH:MM` (24-hour)

---

## Common Zod Schemas (reuse across features)

```typescript
// Indian phone
export const indianPhone = z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number');

// PIN code
export const pinCode = z.string().regex(/^\d{6}$/, 'Invalid PIN code');

// UUID
export const uuid = z.string().uuid('Invalid ID');
```

Place shared schemas in `apps/web/lib/schemas.ts` and `apps/admin/lib/schemas.ts`.
