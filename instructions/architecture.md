# Architecture — Pune Caring Hands

## System Overview

```
Public Web (apps/web)  ──────┐
                             │
Admin (apps/admin)  ─────────┼──► NestJS API (backend/) ──► Prisma ──► PostgreSQL
                             │
Shared Package (@pch/shared) ┘
```

Both frontend applications communicate exclusively with the NestJS backend over HTTP/REST.
Neither frontend application accesses the database directly.

---

## Applications

### apps/web — Public Website + Booking

- Next.js 14 (App Router)
- TypeScript, Tailwind CSS, React Hook Form, Zod
- Port: 3000 (development)
- Serves: public pages, service listings, booking flow, payment submission
- No authentication required for patients in Phase 1

### apps/admin — Admin Panel

- Next.js 14 (App Router)
- TypeScript, Tailwind CSS, React Hook Form, Zod
- Port: 3001 (development)
- Serves: admin login, dashboard, booking management, payment verification, content management
- JWT authentication required for all admin routes

### backend/ — NestJS API

- NestJS, TypeScript, Prisma, PostgreSQL
- Port: 4000 (development)
- API prefix: `/api/v1`
- Admin API prefix: `/api/v1/admin`
- All business logic lives here
- All database access goes through Prisma

### packages/shared — Shared Types

- Pure TypeScript — no runtime framework dependencies
- Exports: enums, constants, API response types
- Consumed by both frontend apps and the backend
- Do NOT put backend-only domain logic here

### prisma/ — Database Schema

- Single Prisma schema at the repository root
- Migrations live in `prisma/migrations/`
- Seed script at `prisma/seed.ts`
- Backend references schema via `prisma.schema` in `backend/package.json`

---

## Module Boundaries

| Layer                | Responsibility                                             |
| -------------------- | ---------------------------------------------------------- |
| Frontend (web/admin) | UI rendering, form validation, API calls, state management |
| Backend controllers  | Route handling, request parsing, response formatting       |
| Backend services     | Business logic, database queries via Prisma                |
| Prisma               | Database access only — no business logic                   |
| Shared package       | Types, enums, constants shared across boundaries           |

### Rules

- Controllers must be thin — delegate all logic to services
- Services must not import from controllers
- Frontend must not contain business logic (pricing, availability, status transitions)
- Shared package must not import from backend or frontend packages
- Backend must not import from frontend packages

---

## Dependency Direction

```
apps/web        → @pch/shared, backend API (HTTP)
apps/admin      → @pch/shared, backend API (HTTP)
backend         → @pch/shared, @prisma/client
packages/shared → (no internal dependencies)
```

---

## Communication

- Frontend → Backend: REST over HTTP, JSON bodies
- Authentication: JWT Bearer token (admin only in Phase 1)
- File uploads: multipart/form-data to backend upload endpoints
- Backend → Database: Prisma ORM only

---

## Monorepo Structure

```
pune-caring-hands/
├── apps/
│   ├── web/          # Public website + booking
│   └── admin/        # Admin panel
├── backend/          # NestJS API
├── packages/
│   └── shared/       # Shared types/enums/constants
├── prisma/           # Database schema + migrations + seed
├── instructions/     # Development instruction files
├── AGENTS.md         # Central development contract
└── package.json      # Root workspace scripts
```

---

## Avoiding Common Mistakes

- Do NOT introduce microservices — single NestJS application
- Do NOT add Turborepo or Nx — pnpm workspaces is sufficient
- Do NOT duplicate enum/type definitions across packages
- Do NOT access the database from controllers
- Do NOT put API call logic inside React components — use lib/api.ts
- Do NOT trust any value from the frontend for pricing, status, or permissions
- Do NOT add a new top-level app without documenting the reason

---

## Future Extension Points

The architecture is designed to accommodate (without requiring now):

- WhatsApp Cloud API: add a `notifications` module in backend
- Razorpay: add a `payment-gateway` module in backend
- Patient accounts: add auth to `apps/web`, add patient auth module to backend
- Additional cities: extend `ServiceArea` model and validation
- Doctor/technician management: add modules in backend, features in admin
