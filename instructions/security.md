# Security — Pune Caring Hands

## General Principles

- Defense in depth — multiple layers of validation and protection
- Least privilege — expose only what is necessary
- Never trust client input for security-critical decisions
- Patient medical information is sensitive data — treat accordingly

---

## HTTPS

- All production traffic must use HTTPS
- HTTP requests should redirect to HTTPS in production
- Use TLS certificates (Let's Encrypt or cloud provider)

---

## Password Security

- Hash passwords with bcrypt, minimum 12 rounds
- Never store plaintext passwords
- Never return `passwordHash` in any API response
- Never log passwords

```typescript
const hash = await bcrypt.hash(password, 12);
const valid = await bcrypt.compare(password, hash);
```

---

## JWT Security

- `JWT_SECRET` must be a cryptographically random string, minimum 32 characters
- Never hardcode JWT secret in source code
- Set appropriate expiry (`JWT_EXPIRES_IN`)
- Validate token on every protected request
- Check `Admin.isActive` in JWT strategy — reject inactive admins
- Never include sensitive data in JWT payload

---

## CORS

- Configure allowed origins via `CORS_ORIGIN` environment variable
- Never use wildcard `*` in production
- Development: `http://localhost:3000,http://localhost:3001`
- Production: exact domain(s) only

---

## Rate Limiting

- Apply rate limiting to all public endpoints
- Stricter limits on auth endpoints (login): e.g. 5 attempts per minute per IP
- Use `@nestjs/throttler` package
- Return `429 Too Many Requests` when limit exceeded

---

## Input Validation

- All request bodies validated via DTOs with class-validator
- `whitelist: true` strips unknown properties
- `forbidNonWhitelisted: true` rejects requests with extra fields
- Validate file uploads: type, size, content
- Sanitize string inputs to prevent injection

---

## File Upload Security

- Validate MIME type server-side (do not trust Content-Type header alone)
- Validate file size (max 5MB)
- Store files in private object storage — not publicly accessible
- Generate time-limited signed URLs for admin access
- Never serve uploaded files directly from the application server
- See `instructions/file-storage.md`

---

## API Security

- All `/api/v1/admin/*` routes require valid JWT
- Public booking endpoints must not expose other patients' data
- Booking lookup by reference must not expose sensitive patient details to unauthenticated users beyond what is necessary
- Never expose database IDs in public-facing URLs where a booking reference suffices

---

## Environment Variables

- All secrets in environment variables — never in source code
- `.env` and `.env.local` are in `.gitignore`
- Use `.env.example` with placeholder values for documentation
- Required variables: `DATABASE_URL`, `JWT_SECRET`, `UPI_ID`

---

## Database Security

- Use parameterized queries (Prisma handles this)
- Never construct raw SQL with user input
- Database user should have minimum required permissions
- Do not expose database connection string to frontend

---

## Sensitive Data Handling

Patient data is sensitive:

- Do not log patient names, phone numbers, or addresses
- Do not include patient medical details in error messages
- Do not expose patient data in public API responses
- Admin APIs that return patient data require JWT authentication

---

## Secure Headers

Configure security headers in production:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` (configure per application)

Use `helmet` package in NestJS for automatic header configuration.

---

## Audit Logging

Log the following events (server-side only):

- Admin login (success and failure)
- Payment verification actions (verify/reject) with admin ID
- Booking status changes

Do not log sensitive patient data in audit logs.

---

## What NOT to Do

- Do NOT commit `.env` files
- Do NOT hardcode secrets, API keys, or credentials
- Do NOT use `*` for CORS in production
- Do NOT expose stack traces in API error responses
- Do NOT store payment proof files in PostgreSQL
- Do NOT return `passwordHash` in any response
- Do NOT trust frontend for pricing, status, or permissions
- Do NOT skip input validation on any endpoint
