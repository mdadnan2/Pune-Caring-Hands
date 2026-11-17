# Testing — Pune Caring Hands

## Testing Stack

| Layer                         | Tool                                        |
| ----------------------------- | ------------------------------------------- |
| Backend unit tests            | Jest + ts-jest                              |
| Backend integration/API tests | Jest + Supertest + NestJS testing utilities |
| Frontend component tests      | Jest + React Testing Library (future)       |
| E2E tests                     | Playwright (future)                         |

---

## Test File Conventions

- Unit tests: `*.spec.ts` co-located with source files
- Integration tests: `test/` directory in backend
- Test files follow the same naming as the source file: `bookings.service.spec.ts`

---

## What Must Be Tested

### Booking Logic (HIGH PRIORITY)

- [ ] Valid booking creation with correct total amount
- [ ] Booking rejected for inactive service
- [ ] Booking rejected for unsupported PIN code
- [ ] Booking rejected for unavailable slot
- [ ] Booking rejected for already-booked slot (double-booking prevention)
- [ ] Backend calculates total amount — ignores any frontend-provided amount
- [ ] Booking reference generated in correct format

### Payment Logic (HIGH PRIORITY)

- [ ] Payment proof submission updates status to SUBMITTED
- [ ] Admin verify action updates payment to VERIFIED and booking to CONFIRMED
- [ ] Admin reject action updates payment to REJECTED with reason
- [ ] Payment amount matches booking total amount
- [ ] Cannot verify already-verified payment

### Authentication (HIGH PRIORITY)

- [ ] Valid credentials return JWT token
- [ ] Invalid credentials return 401
- [ ] Inactive admin cannot login
- [ ] Protected routes reject missing token
- [ ] Protected routes reject invalid/expired token

### Slot Availability (HIGH PRIORITY)

- [ ] Available slot can be booked
- [ ] Unavailable slot cannot be booked
- [ ] Concurrent booking attempts on same slot — only one succeeds

### Service Area Validation

- [ ] Booking accepted for supported PIN code
- [ ] Booking rejected for unsupported PIN code

### Admin Authorization

- [ ] Admin can access admin endpoints with valid JWT
- [ ] Unauthenticated request to admin endpoint returns 401

---

## Test Structure (Backend)

```typescript
// bookings.service.spec.ts
describe('BookingsService', () => {
  describe('createBooking', () => {
    it('should create a booking with backend-calculated total', async () => { ... });
    it('should throw if service is inactive', async () => { ... });
    it('should throw SLOT_UNAVAILABLE if slot is taken', async () => { ... });
    it('should throw AREA_NOT_SUPPORTED for invalid PIN', async () => { ... });
  });
});
```

---

## Mocking

- Mock `PrismaService` in unit tests using Jest mocks
- Use NestJS `Test.createTestingModule()` for integration tests
- Use a test database for integration tests (separate from development database)

---

## Coverage Expectations

Minimum coverage targets for business-critical modules:

- `bookings.service.ts`: 80%+
- `payments.service.ts`: 80%+
- `auth.service.ts`: 90%+
- `slots.service.ts`: 80%+

---

## Running Tests

```bash
# All tests
pnpm test

# Backend tests only
pnpm --filter backend test

# With coverage
pnpm --filter backend test:cov

# Watch mode
pnpm --filter backend test:watch
```

---

## What NOT to Do

- Do NOT skip tests for booking and payment logic
- Do NOT test implementation details — test behavior
- Do NOT use production database for tests
- Do NOT commit failing tests
