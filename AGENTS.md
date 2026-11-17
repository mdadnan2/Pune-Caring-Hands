# AGENTS.md — Pune Caring Hands

This is the **central development contract** for the Pune Caring Hands repository.

Read this file before making any changes to the codebase.
Then read the relevant instruction file(s) listed below.

---

## Project Purpose

Pune Caring Hands is a home healthcare platform for patients in Pune, India.

**Public application:** Patients browse services, book appointments, and pay via UPI.
**Admin application:** Admins manage bookings, verify payments, manage content and settings.

---

## Technology Stack

| Layer      | Technology                                                 |
| ---------- | ---------------------------------------------------------- |
| Public Web | Next.js 14, TypeScript, Tailwind CSS, React Hook Form, Zod |
| Admin      | Next.js 14, TypeScript, Tailwind CSS, React Hook Form, Zod |
| Backend    | NestJS, TypeScript, Prisma, PostgreSQL                     |
| Shared     | TypeScript package (`@pch/shared`)                         |
| Monorepo   | pnpm workspaces                                            |

---

## Repository Structure

```
pune-caring-hands/
├── apps/
│   ├── web/          # Public website + booking (port 3000)
│   └── admin/        # Admin panel (port 3001)
├── backend/          # NestJS API (port 4000)
├── packages/
│   └── shared/       # Shared types, enums, constants (@pch/shared)
├── prisma/           # Schema, migrations, seed
├── instructions/     # Development instruction files (READ THESE)
├── AGENTS.md         # This file
├── .env.example      # Environment variable template
└── README.md
```

---

## Application Boundaries

| Application       | Responsibility                              | Must NOT                                |
| ----------------- | ------------------------------------------- | --------------------------------------- |
| `apps/web`        | Public UI, booking flow, payment submission | Access database, contain business logic |
| `apps/admin`      | Admin UI, management interfaces             | Access database, contain business logic |
| `backend/`        | All business logic, database access, API    | Import from frontend apps               |
| `packages/shared` | Shared types/enums/constants                | Import from backend or frontend         |

---

## Instruction Files

**Before implementing any feature, read the relevant instruction file.**

| Task                                        | Read                               |
| ------------------------------------------- | ---------------------------------- |
| System architecture, module boundaries      | `instructions/architecture.md`     |
| Admin login, JWT, protected routes          | `instructions/authentication.md`   |
| Database schema, Prisma, migrations         | `instructions/database.md`         |
| NestJS modules, controllers, services, DTOs | `instructions/backend.md`          |
| Next.js, components, forms, API calls       | `instructions/frontend.md`         |
| Colors, typography, components, layout      | `instructions/ui-design.md`        |
| Phase 1 services, pages, admin modules      | `instructions/project-features.md` |
| Booking workflow, statuses, slot rules      | `instructions/booking.md`          |
| UPI payment, verification flow              | `instructions/payments.md`         |
| Admin panel modules, dashboard              | `instructions/admin.md`            |
| REST conventions, pagination, errors        | `instructions/api.md`              |
| Zod, class-validator, trusted fields        | `instructions/validation.md`       |
| HTTPS, JWT, CORS, rate limiting             | `instructions/security.md`         |
| Object storage, signed URLs, uploads        | `instructions/file-storage.md`     |
| Jest, test coverage, critical test cases    | `instructions/testing.md`          |

---

## Coding Standards

### TypeScript

- Strict mode enabled in all packages
- No `any` without explicit justification and comment
- No `@ts-ignore` without explanation
- Prefer explicit types over inference for function signatures

### Naming

- Files: `kebab-case.ts` / `PascalCase.tsx` for React components
- Variables/functions: `camelCase`
- Classes/types/interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Database models: `PascalCase` (Prisma convention)
- API routes: `kebab-case`

### Imports

- Use absolute imports with path aliases (`@/*` in Next.js apps)
- Group imports: external packages → internal packages → relative imports
- No circular imports

---

## Backend Architecture Rules

1. Controllers are thin — routing and response only
2. All business logic lives in services
3. All database access goes through `PrismaService`
4. All request bodies use DTO classes with class-validator decorators
5. All admin controllers use `@UseGuards(JwtAuthGuard)`
6. All responses use the standard envelope format
7. All errors use `GlobalExceptionFilter`
8. Never return `passwordHash` or sensitive fields

---

## Frontend Architecture Rules

1. Default to Server Components — add `'use client'` only when necessary
2. All API calls go through `lib/api.ts`
3. All forms use React Hook Form + Zod
4. Feature logic lives in `features/<feature>/`
5. Reusable UI primitives live in `components/ui/`
6. No business logic in components
7. Always handle loading, empty, and error states

---

## Database Rules

1. Use UUIDs for all primary keys
2. Use Prisma enums for status fields
3. Use database transactions for booking creation and payment updates
4. Never trust frontend for prices, statuses, or permissions
5. Snapshot prices and names in `BookingItem` at booking time
6. Never store binary files in PostgreSQL
7. Always generate and commit migration files

---

## API Conventions

- Prefix: `/api/v1`
- Admin prefix: `/api/v1/admin`
- Use `PATCH` for updates (not `PUT`)
- All lists support pagination (`page`, `pageSize`)
- Consistent response envelope (see `instructions/api.md`)
- Machine-readable error codes

---

## Authentication Rules

- Admin authentication only in Phase 1
- No patient login in Phase 1
- JWT with `JWT_SECRET` from environment
- Check `Admin.isActive` on every authenticated request
- Never hardcode JWT secret

---

## Security Rules

- All secrets in environment variables
- Never commit `.env` or `.env.local`
- bcrypt for password hashing (12+ rounds)
- Private object storage for uploaded files
- Signed URLs for file access
- Rate limiting on public endpoints
- CORS restricted to known origins in production

---

## Validation Rules

- Frontend: React Hook Form + Zod
- Backend: class-validator + class-transformer
- Never trust from frontend: price, status, role, slot availability, service area
- Backend recalculates all business-critical values

---

## Error Handling Rules

- Use NestJS built-in exceptions in services
- `GlobalExceptionFilter` formats all error responses
- Never expose stack traces or database errors to clients
- Use machine-readable `code` field in error responses

---

## UI/UX Rules

- Premium minimal healthcare aesthetic
- Navy + White + Teal color palette
- Mobile-first responsive design
- No excessive animations or gradients
- Always show loading, empty, and error states
- Accessible — semantic HTML, keyboard navigation, WCAG AA contrast

---

## Testing Requirements

- All booking logic must have unit tests
- All payment logic must have unit tests
- All auth logic must have unit tests
- Double-booking prevention must be tested
- Run `pnpm test` before committing

---

## Environment Variables

- Template: `.env.example`
- Never commit real values
- Required: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`, `UPI_ID`
- See `.env.example` for full list

---

## Git / Commit Expectations

- Commit messages: `type(scope): description`
  - Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
  - Example: `feat(bookings): add slot availability check`
- Never commit: `.env`, credentials, secrets, `node_modules`
- Keep commits focused — one logical change per commit

---

## Phase 1 Scope

**In scope:**

- Public website (home, services, about, contact, FAQs, testimonials, service areas)
- Booking flow (service selection → patient details → slot → review → UPI payment → confirmation)
- Admin panel (login, dashboard, bookings, payment verification, slots, services, patients, content)

**Explicitly OUT of scope:**

- Patient accounts / login
- Automatic doctor/technician assignment
- Payment gateway (Razorpay etc.)
- WhatsApp Cloud API
- GPS-based service availability
- Cancellation / rescheduling workflow
- Multi-city support
- Microservices

---

## Feature Development Process

Before implementing any feature:

1. Read `AGENTS.md` (this file)
2. Identify and read the relevant `instructions/*.md` files
3. Inspect existing code in the affected area
4. Follow existing patterns and conventions
5. Implement the smallest correct solution
6. Add or update tests for business logic
7. Run `pnpm typecheck` and `pnpm lint`
8. Run `pnpm test`
9. Do not violate Phase 1 scope

**If a requirement conflicts with an instruction file:**
Stop. Explain the conflict. Do not silently change the architecture.

---

## Development Commands

```bash
pnpm install          # Install all dependencies
pnpm dev              # Start all apps in parallel
pnpm build            # Build all apps
pnpm lint             # Lint all packages
pnpm typecheck        # TypeScript check all packages
pnpm test             # Run all tests
pnpm format           # Format all files with Prettier
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run database migrations
pnpm db:seed          # Seed development data
pnpm db:studio        # Open Prisma Studio
```
