# HallWay Creative — Project Context

Source of truth for the overall project. Subsystem-level specs live under `docs/superpowers/specs/`. This file tracks the vision across all subsystems, standing decisions, and things not yet decided — keep it current as the project evolves.

## Who

Andrew — photographer/videographer. Site is being built by a friend (Ethan) using Claude Code.

## Vision

Three related goals, identified as two buildable subsystems:

1. **Marketing/portfolio site** — showcase the quality and diversity of Andrew's work, make it easy to reach out and hire him.
2. **Client gallery delivery** — give paying clients an easy, native (non-redirect) way to access and download their photos/videos.

These are scoped and spec'd separately (see [Scope decomposition](#scope-decomposition)) but share brand identity and site infrastructure.

## Discovery Q&A (from Andrew)

1. **Most important takeaway when someone visits the site:** that his work is high quality and diverse — something they want access to.
2. **Vibe/inspiration:** Simple, professional, yet still immersive.
3. **Needs now vs. later:**
   - Needs: separate portfolio sections (Sports / Weddings / Events / etc.), ability to share galleries with clients that are easy to download — native to the website, not a redirect — and ease of contacting him.

## Scope decomposition

- **Subsystem 1 — Marketing/portfolio site.** Spec'd: `docs/superpowers/specs/2026-09-10-hallway-creative-portfolio-site-design.md`. Building first — it's the higher-priority need and establishes the design system and copy voice everything else inherits.
- **Subsystem 2 — Client gallery delivery.** Not yet spec'd. Separate concerns: client auth/access, private galleries, native downloads, storage backend, bandwidth/storage cost, pricing model. Will get its own brainstorm → spec → plan cycle when we're ready to build it.
  - Key open question already discussed: storage backend. Repurposing Andrew's Dropbox is technically possible (via Dropbox API), but either leaks a `dropboxusercontent.com` URL to clients (breaks the "feels native" requirement) or requires proxying every download through our own server (real bandwidth/compute cost, awkward for multi-GB video). Leaning toward purpose-built object storage (Cloudflare R2 / AWS S3 / Vercel Blob) instead — built for exactly this delivery pattern. Final call deferred to subsystem 2's spec.

## Standing decisions (apply across both subsystems)

- **Visual design** happens in a separate "Claude design" process, not during spec brainstorming. Specs describe structure/content/behavior, not pixels.
- **Implementation** happens via the `/impeccable` skill against approved specs.
- **Brand assets:** blank slate as of 2026-09-10 — no logo, color palette, or typography defined yet. Full identity to be established during the design phase.
- **Domain:** not yet registered.
- **Video (public-facing):** portfolio reels embed from Vimeo/YouTube — no self-hosted video for the public site.
- **Pricing:** services/offerings are listed; no prices shown on the site.
- **QA approach:** after each major section is implemented, a separate harsh-critic reviewer sub-agent compares it against real reference sites and Andrew's stated vibe before it's considered done — see the QA section in the subsystem 1 spec for the concrete version of this.

## Copy / voice

Not yet written. Once a copywriting pass happens, copy should live in dedicated file(s) referenced from here, and that becomes the source of truth — don't let copy get invented ad hoc inside implementation.

## Open questions log

- Client gallery storage backend (Dropbox-proxy vs. R2/S3/Blob) — deferred to subsystem 2 spec.
- CMS: Sanity (provisioned via Vercel marketplace).
- Transactional email: Resend (direct account/API key — the Vercel marketplace `resend/resend-email` product turned out to be paid-only and requires a verified domain we don't have; API key pending from Andrew's Resend dashboard, currently a placeholder in `.env.local`).
- Domain name — needs to be picked and registered.
- Andrew's real photos/videos — not yet provided. Site ships with clearly-marked placeholder media in the meantime; get originals directly from Andrew (e.g. a Dropbox/Drive export), not scraped from Instagram (heavily compressed). Swapping in real content is a CMS content-entry task, not a code change.
- `CONTACT_TO_EMAIL` in `.env.local` still needs Andrew's real email address (currently a placeholder, `andrew@example.com`).
