# Frontend — Pune Caring Hands

## Applications

| App        | Path         | Port | Purpose                       |
| ---------- | ------------ | ---- | ----------------------------- |
| Public Web | `apps/web`   | 3000 | Public website + booking flow |
| Admin      | `apps/admin` | 3001 | Admin panel                   |

---

## Technology

- Next.js 14 (App Router)
- TypeScript (strict)
- Tailwind CSS
- React Hook Form
- Zod (schema validation)
- @hookform/resolvers (Zod integration)

---

## Directory Structure

```
app/                  # Next.js App Router pages and layouts
components/
  ui/                 # Primitive UI components (Button, Input, Badge, etc.)
  layout/             # Layout components (Header, Footer, Sidebar, etc.)
features/
  <feature>/          # Feature-specific components, hooks, and schemas
    components/       # Feature UI components
    hooks/            # Feature-specific hooks
    schemas/          # Zod validation schemas
lib/
  api.ts              # Centralized API fetch utility
  utils.ts            # Shared utility functions
```

---

## Component Rules

### Server vs Client Components

- Default to Server Components — only add `'use client'` when necessary
- Client components are needed for: forms, interactive state, browser APIs
- Keep client component boundaries as small as possible

### Component Size

- Components should do one thing
- Extract sub-components when a component exceeds ~100 lines
- Never put API call logic inside a component — use hooks or lib/api.ts

### Naming

- PascalCase for component files and exports: `BookingForm.tsx`
- camelCase for hooks: `useBookingForm.ts`
- camelCase for utilities: `formatCurrency.ts`

---

## Forms

Use React Hook Form + Zod for all forms:

```typescript
const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid Indian mobile number'),
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
});
```

- Define Zod schemas in `features/<feature>/schemas/`
- Never submit a form without client-side validation
- Always show field-level error messages
- Disable submit button while submitting

---

## API Calls

- All API calls go through `lib/api.ts` (web) or `lib/api.ts` (admin)
- Never use `fetch` directly inside components
- Use React Server Components for initial data fetching where possible
- Use client-side fetching only for interactive/dynamic data

---

## State Management

- Prefer URL state (search params) for filters and pagination
- Prefer React state for local UI state
- Do NOT introduce a global state library (Redux, Zustand) unless clearly justified

---

## UI States

Every data-fetching component must handle:

- Loading state
- Empty state
- Error state
- Success state

---

## Routing (Admin)

```
/login                    # Admin login
/dashboard                # Dashboard
/bookings                 # Booking list
/bookings/[id]            # Booking detail
/payments                 # Payment verification queue
/slots                    # Slot management
/services                 # Service management
/patients                 # Patient list
/service-areas            # Service area management
/faqs                     # FAQ management
/testimonials             # Testimonial management
/content                  # Website content
/settings                 # Settings
```

---

## Routing (Public Web)

```
/                         # Home
/services                 # Services list
/services/[slug]          # Service detail
/about                    # About
/contact                  # Contact
/faqs                     # FAQs
/testimonials             # Testimonials
/service-areas            # Service areas
/book                     # Booking flow
/book/confirmation/[id]   # Booking confirmation
/privacy                  # Privacy policy
/terms                    # Terms of service
```

---

## Accessibility

- Use semantic HTML elements
- All images must have `alt` attributes
- Form inputs must have associated labels
- Interactive elements must be keyboard accessible
- Maintain sufficient color contrast (WCAG AA minimum)

---

## What NOT to Do

- Do NOT use `any` type
- Do NOT put business logic in components
- Do NOT make API calls directly inside JSX
- Do NOT skip loading/error states
- Do NOT use inline styles — use Tailwind classes
- Do NOT add client-side price calculations — display backend-provided prices only
