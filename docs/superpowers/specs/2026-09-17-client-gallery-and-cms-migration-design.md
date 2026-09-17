# Client Gallery Delivery & CMS Migration — Design

Status: Approved
Date: 2026-09-17
Related: `PROJECT.md` (overall project context), `docs/superpowers/specs/2026-09-10-hallway-creative-portfolio-site-design.md` (Subsystem 1, the portfolio site this migrates off Sanity)

## Context

PROJECT.md scoped this as two subsystems: the marketing/portfolio site (Subsystem 1, built and shipped on Sanity CMS) and client gallery delivery (Subsystem 2, deferred, "storage backend and client auth/access model final call deferred to subsystem 2's spec"). This is that spec.

The user brought in an external draft spec (`hallway-creative-gallery-spec.md`) proposing Supabase (Postgres + Auth) + Cloudflare R2 as the stack for client galleries, and — as an explicit, separate decision surfaced during brainstorming — also replacing Sanity entirely rather than running it alongside the new system. Both decisions were confirmed with the user; this document is the reconciled design.

## Goal

1. Andrew can deliver a finished shoot to a client as a private, code-gated gallery they can view and download from — no Dropbox links, no third-party redirect.
2. Andrew (and Ethan) manage everything — portfolio content and client galleries — from one `/admin` dashboard, replacing Sanity Studio.
3. No real content exists in either system yet (portfolio content is still placeholder), so this is a clean cutover, not a data migration.

## Scope decisions (resolved during brainstorming)

- **Full replace, not additive.** Sanity, Sanity Studio, and all `@sanity/*`/`next-sanity` dependencies are removed. Supabase becomes the only backend for both public portfolio content and private client galleries. Decided over the additive alternative (keep Sanity for the portfolio, bolt on Supabase+R2 just for galleries) because there's no real content in Sanity yet to lose, and one backend is simpler to maintain long-term than two.
- **Portfolio content stays self-serve**, not hardcoded — preserves the original "Andrew edits without a code change" requirement. Lives in the same `/admin` dashboard as gallery management, not a separate tool.
- **No client accounts.** Clients get a link + a durable access code (never expires/rotates), not a Supabase Auth login. Decided against real accounts because this is a boutique, single-photographer business with occasional repeat clients — a long-lived unlock cookie plus "ask Andrew to resend the code" covers returning clients with far less to build and no client-facing password-reset flow to support.
- **Access codes are hashed** (bcrypt), never stored or compared in plain text — they gate real clients' private photos.
- **"Download all" ships in v1**, via client-side zipping (JSZip), not deferred to v2. No server-side zip streaming needed at this scale.
- **Admin login is magic-link** via Supabase Auth (no passwords to manage for two users: Andrew and Ethan).
- **R2 custom domain deferred** until `hallwaycreative.com` is registered — same existing blocker already tracked in PROJECT.md for Resend's sending domain. Uses the bucket's public `r2.dev` URL until then.

## Architecture

- **Supabase (Postgres + Auth)**: all structured data (portfolio content, categories, client galleries, photos) and the only auth system, gating `/admin`. No public signup — Andrew and Ethan are the only two Auth users, added manually.
- **Cloudflare R2**: every photo binary, both the public portfolio showcase and private client-gallery photos, in one bucket under separate key prefixes (`portfolio/{categorySlug}/...` and `galleries/{gallerySlug}/...`).
- **`/admin`**: one Next.js-native dashboard, gated by Supabase Auth, covering both portfolio-content editing and gallery management. Replaces Sanity Studio.
- **`/gallery/[slug]`**: public route, access-code gated, images served from R2.
- Public portfolio pages (`/`, `/portfolio`, `/services`, `/about`) keep their current visual design untouched — only their data source changes, from Sanity queries to Supabase queries.

## Data model (Supabase)

```sql
-- Public portfolio content (replaces Sanity's category/mediaItem/service/about/siteSettings)
create table categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  sort_order int default 0
);

create table portfolio_media (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  r2_key text not null,
  url text not null,
  preview_url text not null,
  width int,
  height int,
  sort_order int default 0
);

create table services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category_id uuid references categories(id) on delete set null
);

create table about (
  id uuid primary key default gen_random_uuid(),
  bio text,
  portrait_r2_key text,
  portrait_url text
);
-- single row, enforced at the application level (or a check constraint on a fixed id)

create table site_settings (
  id uuid primary key default gen_random_uuid(),
  hero_headline text,
  hero_subtext text,
  contact_email text,
  instagram_url text
);
-- single row, same pattern as `about`

-- Private client galleries (Subsystem 2)
create table galleries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_name text not null,
  slug text unique not null,
  event_date date,
  access_code_hash text not null,
  status text not null default 'draft', -- draft | published
  created_at timestamptz not null default now()
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid references galleries(id) on delete cascade,
  r2_key text not null,
  url text not null,
  preview_url text not null,
  width int,
  height int,
  filename text,
  sort_order int default 0,
  created_at timestamptz not null default now()
);
```

Row Level Security: admin-write requires an authenticated Supabase session (Andrew or Ethan). Public tables (`categories`, `portfolio_media`, `services`, `about`, `site_settings`) allow public read. `galleries`/`photos` allow **no** direct anonymous read via the public Supabase API — the gallery page reads them only through a server-side query that has already verified the access-code cookie/hash, never exposing the tables to the client directly.

## Admin dashboard (`/admin`)

- `/admin/login` — Supabase magic-link auth.
- `/admin` — overview: site content, portfolio categories, galleries list.
- `/admin/content` — edit hero copy, about bio + portrait, footer settings.
- `/admin/portfolio` — manage categories, drag-and-drop upload showcase photos per category, reorder.
- `/admin/galleries` — list, create-new.
- `/admin/galleries/[id]` — edit title/client/date/access code, drag-and-drop upload, reorder/delete photos, publish/unpublish toggle, **"Send to client"** button (fires the Resend email below).

**Shared upload component**: one drag-and-drop zone, used for both portfolio media and gallery photos. Flow: request a presigned R2 PUT URL (auth-gated API route) → downscale to ~1600px wide via canvas for the preview → upload both original and preview as two R2 objects → insert the row (into `portfolio_media` or `photos` depending on context) once both uploads succeed.

## Client gallery access flow

1. Andrew publishes a gallery and clicks "Send to client" → server route sends a Resend email (reusing the existing integration/domain-verification setup from the contact form) with the gallery link and access code.
2. Client visits `/gallery/[slug]`. If status is `draft`, 404 for anyone without an active admin session.
3. If not already unlocked, a form prompts for the access code. POSTs to an API route that hashes the input and compares against `access_code_hash` server-side (bcrypt), and on success sets an httpOnly cookie scoped to that gallery (`gallery_access_<slug>`), valid for 1 year.
4. Once unlocked: responsive grid using `preview_url`, lightbox on click, a download link per photo (full-res `url`), and a **"Download all"** button that fetches every full-res photo and zips them client-side (JSZip) into one `.zip` for the browser to save.
5. Returning later on the same device/browser: the cookie is still valid, no code needed. On a new device or after cookies are cleared: same durable code works again (never expires or rotates) — retrievable from the original email or by asking Andrew, who can view/re-share it from `/admin` any time.

## Migration off Sanity

Remove `sanity`, `next-sanity`, `@sanity/client`, `@sanity/image-url`, `@sanity/vision` from `package.json`; delete `schemaTypes/`, `sanity.config.ts`, `app/studio/`. Rewire every page currently querying Sanity (`app/page.tsx`, `app/portfolio/page.tsx`, `app/portfolio/[category]/page.tsx`, `app/services/page.tsx`, `app/about/page.tsx`, `components/Footer.tsx`, `components/MediaGrid.tsx`, `components/MediaItemCard.tsx`) to query Supabase instead, replacing `lib/sanity/*` with `lib/supabase/*`. The visual output of every page — the "Screening Room" design system just shipped — is unchanged; only the data-fetching layer moves.

No content migration needed: Sanity currently holds no real photos/copy (everything is placeholder), so this is a clean cutover, not a data transfer.

## Testing

Existing Vitest + Testing Library setup carries over:
- Presign route: mocked S3 client, asserts an authenticated Supabase session is required.
- Access-code gate: hash comparison logic, cookie set on success, rejection on wrong code.
- Gallery page rendering with mocked Supabase data (draft 404, published unlocked/locked states).
- Admin CRUD flows: create gallery, upload registers a photo row, publish/unpublish toggle, send-to-client triggers the Resend call.
- Every existing page test that currently mocks `lib/sanity/queries` gets rewritten against `lib/supabase/queries`.

## Non-goals (v2+)

- Server-side zip streaming (revisit only if real gallery sizes make client-side zipping impractical).
- Client accounts / returning-client login.
- Calendar/booking integration.
- Custom R2 domain (blocked on domain registration, same as Resend's sending domain).
