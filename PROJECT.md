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
- **Subsystem 2 — Client gallery delivery.** Spec'd: `docs/superpowers/specs/2026-09-17-client-gallery-and-cms-migration-design.md`. Storage backend: Cloudflare R2 (confirmed — the purpose-built option flagged below, not the Dropbox-proxy alternative). Client auth/access model: confirmed as a link + durable access code per gallery, no client accounts — matches Pixieset/Pic-Time and the "no signup friction" requirement.
  - This spec turned out to also settle a bigger decision: **Sanity is being replaced entirely by Supabase** (Postgres + Auth), not run alongside it — see Standing decisions below. Subsystem 1's portfolio pages get rewired onto Supabase as part of this work; their visual design (the "Screening Room" pass) is unaffected.

## Standing decisions (apply across both subsystems)

- **Visual design** happens in a separate "Claude design" process, not during spec brainstorming. Specs describe structure/content/behavior, not pixels.
- **Implementation** happens via the `/impeccable` skill against approved specs.
- **Brand assets:** established 2026-09-11 during the final visual design pass — see `DESIGN.md` ("The Screening Room": near-black cinematic default, tally-light red accent, Fraunces + Inter).
- **CMS/backend:** Supabase (Postgres + Auth), replacing Sanity entirely as of the 2026-09-17 client-gallery spec. One backend for both public portfolio content and private client galleries; one `/admin` dashboard (magic-link auth) replaces Sanity Studio. Photo storage: Cloudflare R2.
- **Gallery access-code rate limiting:** a Vercel Firewall rule throttles `/api/gallery/*/unlock` to 10 requests/60s per IP, 15-min block on exceed. Added after code review flagged that gallery access codes are admin-typed free text (e.g. "sunset-2026") with no strength enforcement, and the unlock endpoint is public/unauthenticated — bcrypt's cost factor alone doesn't meaningfully stop parallelized guessing on serverless. Platform-level config, not app code — see Vercel dashboard → Firewall for the live rule.
- **Gallery unlock cookie is HMAC-signed**, not a bare literal value. An earlier draft used a plain `'unlocked'` string, which is forgeable by anyone who can send a raw HTTP request with a guessed/known slug (httpOnly only stops a browser's own JS from touching the cookie, not a hand-crafted request) — found in code review before it ever shipped. `lib/gallerySession.ts` signs/verifies against a server-only `GALLERY_SESSION_SECRET` (set on Vercel across all three environments).
- **Domain:** not yet registered.
- **Video (public-facing):** portfolio reels embed from Vimeo/YouTube — no self-hosted video for the public site.
- **Pricing:** services/offerings are listed; no prices shown on the site.
- **QA approach:** after each major section is implemented, a separate harsh-critic reviewer sub-agent compares it against real reference sites and Andrew's stated vibe before it's considered done — see the QA section in the subsystem 1 spec for the concrete version of this.

## Copy / voice

Not yet written. Once a copywriting pass happens, copy should live in dedicated file(s) referenced from here, and that becomes the source of truth — don't let copy get invented ad hoc inside implementation.

## Open questions log

- Client gallery storage backend (Dropbox-proxy vs. R2/S3/Blob) — deferred to subsystem 2 spec.
- CMS: was Sanity (provisioned via Vercel marketplace); replaced by Supabase as of the 2026-09-17 client-gallery spec — see Standing decisions above. Sanity provisioning is being removed as part of that work, not left in place alongside it.
- Transactional email: Resend (direct account/API key — the Vercel marketplace `resend/resend-email` product turned out to be paid-only and requires a verified domain we don't have; real API key now set in `.env.local`, sending from Resend's shared `onboarding@resend.dev` until `hallwaycreative.com` is registered and verified).
- Domain name — needs to be picked and registered. **Blocks a real dependency, not just cosmetic:** the contact form's email backend confirmed this via a real send test — Resend's account is in sandbox mode and rejects (403) sends to any address except the account's own verified email until a sending domain is verified, so the contact form cannot actually reach Andrew until `hallwaycreative.com` (or another domain) is registered and verified in Resend. The code handles this failure gracefully (shows the "email Andrew directly" fallback), but the form is non-functional for real inquiries until this is resolved.
- Andrew's real photos/videos — not yet provided. Site ships with clearly-marked placeholder media in the meantime. Decided: Andrew uploads his own web-ready photos/videos directly through the `/admin` dashboard himself, rather than handing off a hard drive — simpler, matches his "ease of use" requirement, no middleman curation step needed. Swapping in real content is a content-entry task through `/admin`, not a code change.
- `NEXT_PUBLIC_SITE_URL` — needed to build absolute links in emails sent from the app (the client-gallery "send to client" email). Set on Vercel across Production/Preview/Development (Production/Preview point at `https://hallway-portfolio-site.vercel.app`, Development at `http://localhost:3000`) — found missing during that task's code review, where it would have silently sent real clients a dead `localhost` link. **Follow-up:** once a custom domain is registered, update Production/Preview to point at it instead of the `.vercel.app` URL.

## Status (2026-09-19)

Subsystem 1 (marketing/portfolio site) and the CMS migration off Sanity onto Supabase are both complete and deployed — `/admin` handles all content editing (site copy, about, portfolio categories/media). Subsystem 2 (client gallery delivery) is also complete: galleries/photos schema, admin gallery CRUD + photo upload, send-to-client email, the public access-code-gated gallery page (HMAC-signed unlock cookie, rate-limited), and client-side "download all" are all built, tested, and reviewed.

**Remaining before full launch:**
- Register a domain, verify it in Resend, update `CONTACT_FROM_EMAIL` and `NEXT_PUBLIC_SITE_URL` to the real domain.
- Andrew needs to actually upload real photos/videos and write his real bio/copy through `/admin` — everything is still placeholder content, and no real client galleries have been created yet.

Final brand visual design pass (2026-09-11, "The Screening Room") is complete and live — see `DESIGN.md`.
