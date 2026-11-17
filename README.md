# Pune Caring Hands

Home healthcare platform for patients in Pune, India.

---

## Applications

| App          | Description                   | Port |
| ------------ | ----------------------------- | ---- |
| `apps/web`   | Public website + booking flow | 3000 |
| `apps/admin` | Admin panel                   | 3001 |
| `backend`    | NestJS REST API               | 4000 |

---

## Technology Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, React Hook Form, Zod
- **Backend:** NestJS, TypeScript, Prisma, PostgreSQL
- **Shared:** `@pch/shared` — TypeScript types, enums, constants
- **Monorepo:** pnpm workspaces

---

## Repository Structure

```
pune-caring-hands/
├── apps/
│   ├── web/              # Public website + booking
│   └── admin/            # Admin panel
├── backend/              # NestJS API
│   └── src/
│       ├── common/       # Shared infrastructure (Prisma, filters, guards)
│       └── modules/      # Feature modules
├── packages/
│   └── shared/           # @pch/shared — types, enums, constants
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Migration history
│   └── seed.ts           # Development seed data
├── instructions/         # Development instruction files
├── AGENTS.md             # Central development contract
├── .env.example          # Environment variable template
└── README.md
```

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

- `DATABASE_URL` — your PostgreSQL connection string
- `JWT_SECRET` — a long random string
- `UPI_ID` — your UPI payment ID

### 3. Set up the database

```bash
pnpm db:generate    # Generate Prisma client
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed development data (creates admin user)
```

The seed script reads admin credentials from your `.env` file.
Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before running `pnpm db:seed`.
See `.env.example` for the required variables.

### 4. Start development servers

```bash
pnpm dev
```

This starts all three applications in parallel:

- Public web: http://localhost:3000
- Admin: http://localhost:3001
- Backend API: http://localhost:4000/api/v1

---

## Development Commands

```bash
pnpm dev              # Start all apps
pnpm build            # Build all apps
pnpm lint             # Lint all packages
pnpm typecheck        # TypeScript check
pnpm test             # Run all tests
pnpm format           # Format with Prettier
pnpm db:generate      # Regenerate Prisma client after schema changes
pnpm db:migrate       # Apply new migrations
pnpm db:seed          # Re-seed development data
pnpm db:studio        # Open Prisma Studio (database GUI)
```

---

## Architecture

```
Public Web (apps/web)  ──────┐
                             │
Admin (apps/admin)  ─────────┼──► NestJS API (backend/) ──► Prisma ──► PostgreSQL
                             │
Shared Package (@pch/shared) ┘
```

- Both frontend applications communicate with the backend via REST API
- All business logic lives in the backend
- Frontend never calculates prices or controls booking/payment status
- See `instructions/architecture.md` for full details

---

## Phase 1 Services

| Service                  | Pricing            |
| ------------------------ | ------------------ |
| Doctor Home Consultation | ₹1,500             |
| ECG at Home              | ₹700               |
| Blood Test at Home       | Test-wise pricing  |
| X-Ray at Home            | Type-wise pricing  |
| Medicine Home Delivery   | Prescription-based |
| Online Consultation      | ₹500               |

---

## Phase 1 Scope

**Included:**

- Public website with service listings
- Multi-step booking flow
- UPI payment with manual admin verification
- Admin panel for booking and payment management

**Excluded (future phases):**

- Patient accounts / login
- Payment gateway (Razorpay)
- WhatsApp Cloud API
- Automatic staff assignment
- Multi-city support

---

## Development Guidelines

Read `AGENTS.md` before making any changes.

Each area of the application has a dedicated instruction file in `instructions/`:

- `architecture.md` — System design and boundaries
- `authentication.md` — JWT admin auth
- `database.md` — Prisma schema rules
- `backend.md` — NestJS patterns
- `frontend.md` — Next.js patterns
- `ui-design.md` — Visual design system
- `booking.md` — Booking workflow
- `payments.md` — Payment flow
- `admin.md` — Admin panel modules
- `api.md` — REST conventions
- `validation.md` — Form and DTO validation
- `security.md` — Security requirements
- `file-storage.md` — File upload handling
- `testing.md` — Test requirements

---

## Environment Variables

See `.env.example` for the full list of required environment variables.

Never commit `.env` or `.env.local` files.
