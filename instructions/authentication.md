# Authentication — Pune Caring Hands

## Phase 1 Scope

**Admin authentication only.**

- No patient login
- No patient registration
- No patient accounts
- No patient sessions

Patients interact with the booking flow anonymously. Patient identity is captured via the booking form.

---

## Admin Authentication

### Technology

- JWT (JSON Web Tokens) via `@nestjs/jwt` and `passport-jwt`
- Password hashing via `bcrypt` (minimum 12 rounds)
- Tokens stored in `httpOnly` cookies or `localStorage` on the admin frontend (prefer `httpOnly` cookies)

### Login Flow

```
POST /api/v1/admin/auth/login
  → Validate email + password
  → Verify admin is active
  → Return JWT access token
```

### Token

- Payload: `{ sub: adminId, email, iat, exp }`
- Expiry: configurable via `JWT_EXPIRES_IN` env var (default: 8h)
- Secret: `JWT_SECRET` env var — never hardcoded

### Protected Routes

- All `/api/v1/admin/*` routes require a valid JWT
- Use `JwtAuthGuard` on all admin controllers
- Apply guard at controller level, not route level, to avoid accidental exposure

### Backend Guards

```typescript
// Apply to all admin controllers
@UseGuards(JwtAuthGuard)
@Controller('admin/bookings')
export class AdminBookingsController {}
```

### Frontend Route Protection (apps/admin)

- Middleware or layout-level check for valid session token
- Redirect unauthenticated users to `/login`
- Do NOT render admin UI before authentication is confirmed

### Logout

- Clear token from client storage
- No server-side token invalidation in Phase 1 (stateless JWT)
- Future: implement token blacklist or refresh token rotation

### Admin Status

- `Admin.isActive` field controls access
- Inactive admins must be rejected even with a valid token
- Check `isActive` in the JWT strategy `validate()` method

### Password Rules

- Minimum 8 characters
- Hashed with bcrypt before storage
- Never stored in plaintext
- Never returned in API responses

---

## What NOT to Implement in Phase 1

- Patient login/registration
- OAuth/social login
- Multi-factor authentication
- Refresh tokens (acceptable future enhancement)
- Role-based access control beyond single admin role
- Password reset flow (acceptable future enhancement)

---

## Security Notes

- `JWT_SECRET` must be a long random string (minimum 32 characters)
- Never log JWT tokens
- Never include sensitive data in JWT payload
- Set appropriate CORS origins — do not use wildcard `*` in production
- See `instructions/security.md` for broader security rules
