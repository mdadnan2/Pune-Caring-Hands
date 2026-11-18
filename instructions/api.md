# API Conventions — Pune Caring Hands

## Base URL

```
Development:  http://localhost:4000/api/v1
Production:   https://api.punecalinghands.in/api/v1
```

## Route Prefixes

```
/api/v1/...          Public endpoints (no auth required)
/api/v1/admin/...    Admin endpoints (JWT required)
```

---

## HTTP Methods

| Method   | Usage                        |
| -------- | ---------------------------- |
| `GET`    | Retrieve resource(s)         |
| `POST`   | Create a new resource        |
| `PATCH`  | Partial update of a resource |
| `DELETE` | Delete a resource            |

Do NOT use `PUT` — use `PATCH` for updates.

---

## URL Conventions

- Lowercase, hyphen-separated: `/service-areas`, `/booking-items`
- Resource collections: plural nouns: `/bookings`, `/patients`
- Single resource: `/bookings/:id`
- Nested actions: `/bookings/:id/confirm`, `/payments/:id/verify`

---

## Response Format

### Success (single resource)

```json
{
  "success": true,
  "data": { ... }
}
```

### Success (list with pagination)

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error

```json
{
  "success": false,
  "message": "Selected slot is no longer available",
  "code": "SLOT_UNAVAILABLE"
}
```

---

## Error Codes

Use consistent machine-readable error codes:

| Code                       | Meaning                               |
| -------------------------- | ------------------------------------- |
| `SLOT_UNAVAILABLE`         | Slot is already booked or inactive    |
| `SERVICE_NOT_FOUND`        | Service does not exist or is inactive |
| `AREA_NOT_SUPPORTED`       | Patient PIN code not in service area  |
| `INVALID_CREDENTIALS`      | Wrong email or password               |
| `UNAUTHORIZED`             | Missing or invalid JWT                |
| `BOOKING_NOT_FOUND`        | Booking does not exist                |
| `PAYMENT_ALREADY_VERIFIED` | Payment already verified              |
| `VALIDATION_ERROR`         | DTO validation failed                 |
| `INTERNAL_ERROR`           | Unexpected server error               |

---

## Pagination

All list endpoints support:

```
GET /api/v1/admin/bookings?page=1&pageSize=20
```

Defaults: `page=1`, `pageSize=20`
Maximum: `pageSize=100`

---

## Filtering & Sorting

```
GET /api/v1/admin/bookings?status=CONFIRMED&serviceId=uuid&from=2024-01-01&to=2024-12-31
GET /api/v1/admin/bookings?sort=createdAt&order=desc
```

---

## Search

```
GET /api/v1/admin/patients?search=John
GET /api/v1/admin/bookings?search=PCH-20240315
```

Search is case-insensitive, partial match on relevant fields.

---

## Authentication

Admin endpoints require:

```
Authorization: Bearer <jwt_token>
```

Missing or invalid token returns:

```json
{
  "success": false,
  "message": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

---

## File Uploads

Use `multipart/form-data` for file upload endpoints.

```
GET  /api/v1/payments/instructions
POST /api/v1/payments/:bookingRef/proof
Content-Type: multipart/form-data

Fields:
  - proof: (required binary payment screenshot)
```

Backend validates:

- File type (JPEG, PNG, PDF only)
- File size (max 5MB)
- Booking exists and accepts a payment proof in its current state
- Proof is validated by file signature as well as upload metadata

Admin proof and prescription files are served only through authenticated admin booking routes.

---

## Versioning

API is versioned via URL prefix (`/api/v1`).
Breaking changes require a new version (`/api/v2`).
Do not introduce breaking changes to existing endpoints without versioning.

---

## What NOT to Do

- Do NOT return `passwordHash` or sensitive fields
- Do NOT return raw Prisma errors to clients
- Do NOT skip pagination on list endpoints
- Do NOT use `200 OK` for errors — use appropriate HTTP status codes
- Do NOT accept `totalAmount` or `status` from the frontend
