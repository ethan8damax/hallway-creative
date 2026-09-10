# HallWay Creative — Marketing/Portfolio Site Design

Status: Approved
Date: 2026-09-10
Related: `PROJECT.md` (overall project context), Subsystem 2 (client gallery delivery — not yet spec'd)

## Goal

A marketing/portfolio website for Andrew (photographer/videographer) that makes visitors believe his work is high quality and diverse, and makes it easy for them to reach out and hire him. Simple, professional, immersive — not flashy, not generic-template.

## Scope

**In scope:**
- Public portfolio showcasing work across categories (starting with Sports, Weddings, Events)
- Services/offerings overview (no pricing)
- About/bio page
- Contact form (emails Andrew directly)
- Self-serve content management so Andrew can add photos/videos and new categories without a code change

**Explicitly out of scope** (belongs to Subsystem 2, spec'd separately later):
- Client login / private galleries
- Native downloads of client deliverables
- Storage backend for client media
- Pricing/payment for client gallery access

## Architecture

- **Framework/hosting:** Next.js (App Router) on Vercel.
- **Content:** headless CMS holds portfolio images, categories, service descriptions, and about copy. Andrew manages content through the CMS's admin UI — no code changes needed to add a photo or an entirely new category (e.g. "Portraits" later). Exact CMS vendor is selected at implementation time via the Vercel marketplace, not decided in this spec.
- **Contact form:** submits to a serverless function that sends a transactional email to Andrew. No database — nothing downstream needs the submission stored. Vendor for the email service is likewise selected at implementation time via the Vercel marketplace.
- **Video:** public portfolio reels embed via Vimeo/YouTube iframe. No self-hosted video, no video storage/bandwidth cost on our side.
- **Domain:** not yet registered — needs to be picked and set up as part of implementation.

## Site structure

| Page | Content |
|---|---|
| **Home** | Hero, short intro, highlights pulled from across categories, CTA to contact |
| **Portfolio** | Category-based galleries — Sports / Weddings / Events at launch. Categories are CMS-driven, not hardcoded, so adding a new category later is a content edit, not a deploy. |
| **Services** | What Andrew offers per category, descriptive only — no prices |
| **About** | Bio/story — personal connection, not just a work sample dump |
| **Contact** | Simple form: name, email, event type, message → emails Andrew directly. No calendar/booking integration yet (possible future nice-to-have) |
| **Footer** | Social links, contact email |

## Content model (CMS)

- **Category** (e.g. Sports, Weddings, Events): name, description, ordered list of media items. Adding a category is a CMS operation, not a code change.
- **Media item**: image (or Vimeo/YouTube embed reference for video), belongs to one category, display order.
- **Service**: title, description, associated category (optional).
- **About copy**: bio text, portrait photo.
- **Site-wide copy**: hero text, footer text — editable without redeploy.

## Error handling

- Contact form: client-side and server-side validation (required fields, valid email); honeypot field for basic spam protection; graceful user-facing failure message if the email send fails (never a silent failure or raw error).
- Empty category (no media yet): render a clean empty state rather than a broken/blank gallery, so Andrew can create a category in the CMS before populating it without the live site looking broken.

## QA / Review Loop

After `/impeccable` implements each major section (Home, Portfolio gallery, Services, About, Contact), a separate reviewer sub-agent visually checks that section against 2-3 real professional photography portfolio sites (e.g. Format, Pic-Time, top-tier Squarespace photography templates) and against the stated vibe ("simple, professional, yet immersive"). The reviewer gives honest pass/fail feedback — not a rubber stamp. A section that falls short goes back for another implementation pass before moving to the next section. This is a concrete, bounded quality gate per section, not an open-ended loop.

## Testing

No accounts, no database, low logic surface — this is a static-content-plus-form site. Testing is scoped accordingly:
- Smoke check that each page renders with CMS content present and with an empty category.
- Contact form: submits successfully, validates required fields, handles a simulated send failure gracefully.
- The QA review loop above covers visual/quality verification; no separate visual regression suite is needed at this scope.

## Non-goals

- No client accounts or authentication (Subsystem 2).
- No self-hosted video.
- No pricing/payment on the public site.
- No calendar/booking integration at launch.

## Open items (tracked in `PROJECT.md`)

- CMS vendor selection (implementation time, via marketplace)
- Transactional email vendor selection (implementation time, via marketplace)
- Domain name selection and registration
