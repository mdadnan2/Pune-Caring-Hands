# UI Design — Pune Caring Hands

## Design Philosophy

**Premium Minimal Healthcare UI**

The interface must feel trustworthy, clean, and professional.
Healthcare users need clarity and confidence — not visual noise.

---

## Visual Direction

### Public Website (apps/web)

- Premium, minimal, trustworthy
- Strong typography hierarchy
- Generous whitespace
- Clean section layouts
- Mobile-first responsive design
- Fast-loading — avoid heavy animations

### Admin Panel (apps/admin)

- Clean analytics dashboard aesthetic
- Information-dense but well-organized
- Clear data hierarchy
- Functional over decorative

---

## Color Palette

| Token    | Hex       | Usage                            |
| -------- | --------- | -------------------------------- |
| Navy 800 | `#172554` | Primary headings, nav background |
| Navy 600 | `#1e3a8a` | Primary buttons, links           |
| Teal 500 | `#14b8a6` | Accent, highlights, CTAs         |
| White    | `#ffffff` | Backgrounds, cards               |
| Gray 50  | `#f9fafb` | Page backgrounds                 |
| Gray 100 | `#f3f4f6` | Card backgrounds, borders        |
| Gray 500 | `#6b7280` | Secondary text                   |
| Gray 900 | `#111827` | Body text                        |

### Status Colors

| Status              | Color               |
| ------------------- | ------------------- |
| Success / Confirmed | Green 600 `#16a34a` |
| Warning / Pending   | Amber 500 `#f59e0b` |
| Error / Rejected    | Red 600 `#dc2626`   |
| Info / Processing   | Blue 500 `#3b82f6`  |

---

## Typography

- Font family: Inter (Google Fonts) with system-ui fallback
- Heading scale: text-4xl → text-3xl → text-2xl → text-xl → text-lg
- Body: text-base (16px)
- Small/caption: text-sm
- Line height: relaxed for body, tight for headings

---

## Spacing

- Use Tailwind spacing scale consistently
- Section padding: `py-16 md:py-24` on public pages
- Card padding: `p-6`
- Form field gap: `gap-4`
- Button padding: `px-6 py-3`

---

## Components

### Buttons

```
Primary:   bg-navy-600 text-white hover:bg-navy-700
Secondary: border border-navy-600 text-navy-600 hover:bg-navy-50
Danger:    bg-red-600 text-white hover:bg-red-700
Ghost:     text-gray-600 hover:bg-gray-100
```

### Cards

- `bg-white rounded-xl shadow-sm border border-gray-100 p-6`
- Avoid heavy shadows — use subtle `shadow-sm`

### Badges / Status Pills

```
CONFIRMED:           bg-green-100 text-green-700
PAYMENT_PENDING:     bg-amber-100 text-amber-700
PAYMENT_VERIFICATION: bg-blue-100 text-blue-700
REQUESTED:           bg-gray-100 text-gray-700
CANCELLED:           bg-red-100 text-red-700
```

### Form Inputs

- `border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-navy-500 focus:border-navy-500`
- Error state: `border-red-500 focus:ring-red-500`
- Error message: `text-sm text-red-600 mt-1`

### Tables (Admin)

- Clean, no zebra striping unless needed for readability
- Sticky header for long tables
- Row hover: `hover:bg-gray-50`
- Pagination below table

---

## Avoid

- Excessive gradients
- Glassmorphism effects
- Heavy animations or transitions
- Overly colorful dashboards
- Decorative elements that don't serve the user
- Dark mode (Phase 1 — light mode only)
- Custom scrollbars
- Floating action buttons on desktop

---

## Responsive Breakpoints

Use Tailwind defaults:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

Public website: mobile-first, fully responsive
Admin panel: optimized for desktop (md+), functional on tablet

---

## Icons

Use a single icon library consistently — recommend Heroicons (MIT license, React package available).
Do not mix multiple icon libraries.

---

## Images

- Use `next/image` for all images
- Provide meaningful `alt` text
- Use WebP format where possible
- Lazy load below-the-fold images

---

## Public Website Sections

Home page sections (in order):

1. Hero — headline, subheadline, primary CTA
2. Services — service cards grid
3. How It Works — 3-step process
4. Why Choose Us — trust signals
5. Testimonials — patient reviews
6. Service Areas — Pune coverage
7. FAQs — accordion
8. CTA — book now banner
9. Footer — links, contact, WhatsApp

---

## Admin Dashboard Layout

```
┌─────────────────────────────────────────────┐
│  Sidebar (nav)  │  Main content area         │
│                 │  ┌──────────────────────┐  │
│  - Dashboard    │  │  Page header         │  │
│  - Bookings     │  ├──────────────────────┤  │
│  - Payments     │  │  Metric cards        │  │
│  - Slots        │  ├──────────────────────┤  │
│  - Services     │  │  Data table / form   │  │
│  - Patients     │  └──────────────────────┘  │
│  - ...          │                             │
└─────────────────────────────────────────────┘
```
