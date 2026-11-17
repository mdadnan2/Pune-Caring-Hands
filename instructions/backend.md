# Backend — Pune Caring Hands

## Technology

- NestJS (Node.js framework)
- TypeScript (strict mode)
- Prisma (database access)
- class-validator + class-transformer (DTO validation)
- @nestjs/jwt + passport-jwt (authentication)
- @nestjs/config (environment configuration)

---

## API Prefix

```
/api/v1          — public endpoints
/api/v1/admin    — admin-only endpoints (JWT protected)
```

---

## Module Structure

Each feature lives in `backend/src/modules/<feature>/` and contains:

```
<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts      # thin — routing only
├── <feature>.service.ts         # business logic
└── dto/
    ├── create-<feature>.dto.ts
    └── update-<feature>.dto.ts
```

Common infrastructure lives in `backend/src/common/`:

```
common/
├── prisma/          # PrismaService + PrismaModule
├── filters/         # GlobalExceptionFilter
├── interceptors/    # ResponseInterceptor
├── guards/          # JwtAuthGuard
└── decorators/      # CurrentAdmin decorator
```

---

## Controller Rules

- Controllers handle routing, request parsing, and response delegation only
- No business logic in controllers
- No direct Prisma calls in controllers
- Use DTOs for all request bodies
- Use `@UseGuards(JwtAuthGuard)` on all admin controllers

```typescript
@Controller('admin/bookings')
@UseGuards(JwtAuthGuard)
export class AdminBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  findAll(@Query() query: ListBookingsDto) {
    return this.bookingsService.findAll(query);
  }
}
```

---

## Service Rules

- All business logic lives in services
- Services use `PrismaService` for database access
- Services throw `HttpException` (or NestJS built-in exceptions) for error cases
- Services must validate business rules (slot availability, pricing, status transitions)

---

## DTO Rules

- All request bodies must use a DTO class
- Use `class-validator` decorators for validation
- Use `class-transformer` for type transformation
- Never trust frontend values for: price, role, booking status, slot availability

```typescript
export class CreateBookingDto {
  @IsUUID()
  serviceId: string;

  @IsString()
  @MinLength(2)
  patientName: string;

  // totalAmount is NOT accepted from frontend — backend calculates it
}
```

---

## Response Format

All responses use the standard envelope:

**Success:**

```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Selected slot is no longer available",
  "code": "SLOT_UNAVAILABLE"
}
```

The `ResponseInterceptor` wraps successful responses automatically.
The `GlobalExceptionFilter` formats error responses.

---

## Error Handling

- Use NestJS built-in exceptions: `NotFoundException`, `BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `ConflictException`
- Use custom error codes in the `code` field for client-side handling
- Never expose stack traces or database errors to clients
- Log errors server-side

---

## Pagination

All list endpoints must support pagination:

```
GET /api/v1/admin/bookings?page=1&pageSize=20&status=CONFIRMED
```

Response:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Environment Configuration

Use `@nestjs/config` with `ConfigService` — never use `process.env` directly in services.

```typescript
constructor(private config: ConfigService) {}
const secret = this.config.get<string>('JWT_SECRET');
```

---

## What NOT to Do

- Do NOT put business logic in controllers
- Do NOT access Prisma directly from controllers
- Do NOT return `passwordHash` or sensitive fields in responses
- Do NOT use `any` type without justification
- Do NOT hardcode secrets, prices, or configuration values
- Do NOT skip DTO validation on any endpoint
