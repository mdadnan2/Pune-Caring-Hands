# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Patients in Pune and family members or caregivers booking home healthcare on a patient's behalf, especially when leaving home is difficult or inconvenient.

## Product Purpose

Pune Caring Hands helps people access professional healthcare at home. Users can browse services, provide patient and service details, select a time slot, submit UPI payment proof, and receive confirmation after review.

## Positioning

A local Pune home-healthcare service that makes professional care accessible at home through a simple booking flow and manual UPI verification.

## Operating Context

The public website supports service discovery and booking. The booking flow covers service selection, patient details, service details, time slot selection, review, UPI payment, and confirmation. The public web app communicates with a backend REST API; business logic, prices, statuses, and availability remain backend-owned.

## Capabilities and Constraints

- Phase 1 services are doctor home consultation, ECG at home, blood test at home, X-ray at home, medicine home delivery, and online consultation.
- The service area is Pune and nearby supported communities; multi-city support is out of scope for Phase 1.
- Payments use UPI with manual admin verification; a payment gateway is out of scope for Phase 1.
- Patient accounts and patient login are out of scope for Phase 1.
- The public app must not access the database or contain business logic.
- Prices, booking statuses, slot availability, and service-area eligibility must be recalculated or validated by the backend.
- The web experience must be mobile-first and support loading, empty, and error states.

## Brand Commitments

- Product name: Pune Caring Hands.
- Geographic identity: home healthcare for Pune, India.

## Evidence on Hand

- Public routes and booking flow: `app/`, including `app/book/`.
- Service, FAQ, testimonial, and service-area content: `lib/site-data.ts`.
- Product and scope documentation: repository `README.md` and `AGENTS.md`.
- The repository contains service listings and testimonial copy, but future work must not invent additional testimonials, customers, outcomes, or performance claims.

## Product Principles

- Make professional care easier to access from home.
- Keep booking understandable from service choice through confirmation.
- Be transparent about services, pricing, coverage, and payment verification.
- Preserve backend authority over safety- and business-critical decisions.
- Support patients and caregivers with a practical mobile-first experience.

## Accessibility & Inclusion

The web experience must be accessible, keyboard navigable, and designed for WCAG AA contrast. It must work responsively on mobile and desktop and use semantic HTML where applicable.
