# Sanity → Supabase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Sanity entirely with Supabase (Postgres + Auth) as the backend for HallWay Creative's public portfolio content, and stand up the shared admin/auth/upload infrastructure that the client-gallery plan builds on next.

**Architecture:** Supabase Postgres holds portfolio content (categories, media, services, about, site settings); Supabase Auth (magic link) gates a new `/admin` dashboard for the two known users (Andrew, Ethan). Cloudflare R2 holds photo binaries via presigned browser uploads. Every existing public page keeps its current visual output — only the data-fetching layer moves from `lib/sanity/*` to `lib/supabase/*`.

**Tech Stack:** Next.js 16 (App Router), `@supabase/supabase-js`, `@supabase/ssr`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, Vitest + Testing Library.

**Depends on nothing.** The client-gallery plan (`2026-09-17-client-gallery-delivery.md`) depends on this one finishing first — it reuses the Supabase clients, admin auth shell, and `UploadZone` component built here.

---

## Task 1: Manual infra setup + dependency swap

**Files:**
- Modify: `package.json`
- Modify: `.env.local` (not committed — gitignored)
- Modify: `next.config.ts`

This task is mostly manual account setup (can't be scripted), plus the dependency swap.

- [ ] **Step 1: Create the Supabase project**

Go to supabase.com → New Project. Note the project URL and, from Project Settings → API: the `anon` public key and the `service_role` secret key.

- [ ] **Step 2: Enable magic-link auth**

Supabase dashboard → Authentication → Providers → Email → ensure "Email OTP" / magic link is on, password auth can stay off (not needed). Authentication → Users → manually add two users by email: Andrew's and Ethan's. No public signup is being built, so this manual add is the only way either of you gets an account.

- [ ] **Step 3: Create the Cloudflare R2 bucket**

Cloudflare dashboard → R2 → Create bucket → name it `hallway-creative-media`. Then R2 → Manage R2 API Tokens → create a token scoped to this bucket only, with Object Read & Write. Save the Access Key ID and Secret Access Key — they're shown once. Note your account ID (shown in the R2 overview page) for the endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.

- [ ] **Step 4: Enable public access + CORS on the bucket**

Bucket → Settings → enable the public `r2.dev` URL (custom domain comes later, once `hallwaycreative.com` is registered — tracked in `PROJECT.md`). Bucket → Settings → CORS Policy → add:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://hallway-portfolio-site.vercel.app"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

- [ ] **Step 5: Add environment variables**

Add to `.env.local` (and mirror in Vercel project settings → Environment Variables, all three environments):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=hallway-creative-media
R2_PUBLIC_URL=
```

`R2_PUBLIC_URL` is the bucket's `r2.dev` URL from Step 4 (e.g. `https://pub-xxxx.r2.dev`).

- [ ] **Step 6: Swap dependencies**

```bash
npm uninstall sanity next-sanity @sanity/client @sanity/image-url @sanity/vision
npm install @supabase/supabase-js @supabase/ssr @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

- [ ] **Step 7: Update `next.config.ts` image remote patterns**

Sanity's `cdn.sanity.io` pattern gets replaced with R2's. Read `next.config.ts` first to confirm current content, then replace the `remotePatterns` array:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.r2.dev" }],
  },
};

export default nextConfig;
```

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json next.config.ts
git commit -m "Swap Sanity deps for Supabase + R2 SDKs"
```

---

## Task 2: Supabase client helpers

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/service.ts`
- Test: `lib/supabase/client.test.ts`

Three clients, three purposes: `client.ts` for browser components (anon key, used by the admin login form), `server.ts` for server components/route handlers that need the *current user's session* (anon key + cookies, used by admin pages to check who's logged in), `service.ts` for server-only privileged access that bypasses RLS entirely (service role key, never imported by anything that ships to the browser — used by every admin mutation and by the gallery-access flow in the next plan).

- [ ] **Step 1: Write the browser client**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Write the server (session-aware) client**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // ponytail: setAll is called from a Server Component sometimes, where
            // cookies() is read-only — middleware.ts is what actually persists the
            // refreshed session in that case, so this failure is expected and safe.
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Write the service-role (privileged) client**

```typescript
// lib/supabase/service.ts
import { createClient } from '@supabase/supabase-js'

// ponytail: service role key bypasses RLS entirely — only ever import this
// from server-only code (route handlers, server actions, server components).
// Never from a 'use client' file.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
```

- [ ] **Step 4: Write a smoke test for the browser client factory**

```typescript
// lib/supabase/client.test.ts
import { describe, it, expect } from 'vitest'
import { createClient } from './client'

describe('createClient', () => {
  it('returns a Supabase client without throwing', () => {
    expect(() => createClient()).not.toThrow()
  })
})
```

- [ ] **Step 5: Add test env vars**

Read `vitest.config.ts` first (it currently sets dummy `NEXT_PUBLIC_SANITY_*` vars for the same reason). Replace that `env` block:

```typescript
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    },
```

- [ ] **Step 6: Run the test**

Run: `npm test -- lib/supabase/client.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/supabase/client.ts lib/supabase/server.ts lib/supabase/service.ts lib/supabase/client.test.ts vitest.config.ts
git commit -m "Add Supabase browser/server/service client helpers"
```

---

## Task 3: Portfolio content schema

**Files:**
- Create: `supabase/migrations/0001_portfolio_content.sql`

Run this SQL directly in the Supabase dashboard's SQL Editor (Supabase doesn't require the CLI for a project this size — the file is kept in the repo as the source of truth for what's been applied).

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0001_portfolio_content.sql

create table categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  sort_order int not null default 0
);

create table portfolio_media (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  r2_key text,
  image_url text,
  preview_url text,
  video_url text,
  caption text,
  sort_order int not null default 0
);

create table services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category_id uuid references categories(id) on delete set null,
  sort_order int not null default 0
);

create table about (
  id uuid primary key default gen_random_uuid(),
  bio text,
  portrait_r2_key text,
  portrait_url text
);

create table site_settings (
  id uuid primary key default gen_random_uuid(),
  hero_headline text,
  hero_subtext text,
  contact_email text,
  instagram_url text
);

-- `about` and `site_settings` are single-row tables. Seed the one row each
-- now so the app never has to handle "no row exists yet".
insert into about (bio) values (null);
insert into site_settings (hero_headline, contact_email) values ('HallWay Creative', 'hallway.ah@gmail.com');

-- Public read on all portfolio content; writes only via the service-role
-- client from server-only admin code (see lib/supabase/service.ts) — no
-- anon write policy is created, so the public API can never mutate these.
alter table categories enable row level security;
alter table portfolio_media enable row level security;
alter table services enable row level security;
alter table about enable row level security;
alter table site_settings enable row level security;

create policy "public read categories" on categories for select using (true);
create policy "public read portfolio_media" on portfolio_media for select using (true);
create policy "public read services" on services for select using (true);
create policy "public read about" on about for select using (true);
create policy "public read site_settings" on site_settings for select using (true);
```

- [ ] **Step 2: Apply it**

Paste into Supabase dashboard → SQL Editor → Run. Confirm all 5 tables appear under Table Editor, and that `about`/`site_settings` each have exactly one row.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0001_portfolio_content.sql
git commit -m "Add Supabase schema for portfolio content"
```

---

## Task 4: Portfolio content types and queries

**Files:**
- Create: `lib/supabase/types.ts`
- Create: `lib/supabase/queries.ts`
- Test: `lib/supabase/queries.test.ts`

Mirrors `lib/sanity/queries.ts`'s function names so Task 6's page rewiring is close to a 1:1 import swap. Field shapes change to match the real schema from Task 3 (in particular, `MediaItem` gains the `media_type`/`video_url`/`caption` fields the old Sanity type also had, which the current `MediaItemCard` component already expects).

- [ ] **Step 1: Write the types**

```typescript
// lib/supabase/types.ts
export type Category = {
  id: string
  title: string
  slug: string
  description: string | null
  sort_order: number
}

export type MediaItem = {
  id: string
  media_type: 'image' | 'video'
  image_url: string | null
  preview_url: string | null
  video_url: string | null
  caption: string | null
  sort_order: number
}

export type Service = {
  id: string
  title: string
  description: string
  category_id: string | null
  sort_order: number
}

export type About = {
  id: string
  bio: string | null
  portrait_url: string | null
}

export type SiteSettings = {
  id: string
  hero_headline: string | null
  hero_subtext: string | null
  contact_email: string | null
  instagram_url: string | null
}
```

- [ ] **Step 2: Write the failing test for `getCategories`**

```typescript
// lib/supabase/queries.test.ts
import { describe, it, expect, vi } from 'vitest'
import { getCategories } from './queries'

vi.mock('./service', () => ({
  createServiceClient: vi.fn(),
}))

import { createServiceClient } from './service'

function mockQueryResult(data: unknown) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data, error: null }),
      }),
    }),
  }
}

describe('getCategories', () => {
  it('returns categories ordered by sort_order', async () => {
    const categories = [{ id: '1', title: 'Sports', slug: 'sports', description: null, sort_order: 0 }]
    vi.mocked(createServiceClient).mockReturnValue(mockQueryResult(categories) as never)

    const result = await getCategories()

    expect(result).toEqual(categories)
  })
})
```

Note: `createServiceClient` is used here (not the anon browser/server client) because these are public-content reads on the server side (pages are server components) — using the service client for reads is simplest and safe since these tables' RLS already allows public select anyway; it avoids needing a request-scoped client in a function with no access to cookies.

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test -- lib/supabase/queries.test.ts`
Expected: FAIL — `getCategories` is not exported from `./queries` (module doesn't exist yet).

- [ ] **Step 4: Write the queries module**

```typescript
// lib/supabase/queries.ts
import { createServiceClient } from './service'
import type { Category, MediaItem, Service, About, SiteSettings } from './types'

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await createServiceClient()
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Category[]
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await createServiceClient()
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data as Category | null
}

export async function getMediaItemsForCategory(categoryId: string): Promise<MediaItem[]> {
  const { data, error } = await createServiceClient()
    .from('portfolio_media')
    .select('*')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as MediaItem[]
}

export async function getServices(): Promise<Service[]> {
  const { data, error } = await createServiceClient()
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Service[]
}

export async function getAbout(): Promise<About | null> {
  const { data, error } = await createServiceClient().from('about').select('*').limit(1).maybeSingle()
  if (error) throw error
  return data as About | null
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const { data, error } = await createServiceClient().from('site_settings').select('*').limit(1).maybeSingle()
  if (error) throw error
  return data as SiteSettings | null
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- lib/supabase/queries.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/supabase/types.ts lib/supabase/queries.ts lib/supabase/queries.test.ts
git commit -m "Add Supabase types and queries for portfolio content"
```

---

## Task 5: Rewire public pages off Sanity

**Files:**
- Modify: `app/layout.tsx`, `app/page.tsx`, `app/portfolio/page.tsx`, `app/portfolio/[category]/page.tsx`, `app/services/page.tsx`, `app/about/page.tsx`
- Modify: `components/Footer.tsx`, `components/MediaGrid.tsx`, `components/MediaItemCard.tsx`
- Modify (tests): `app/page.test.tsx`, `app/portfolio/[category]/page.test.tsx`, `app/services/page.test.tsx`, `app/about/page.test.tsx`

Read each file listed above in full before editing — this task is a mechanical but precise swap: `@/lib/sanity/queries` → `@/lib/supabase/queries`, `_id` → `id`, `order` → `sort_order`, and the image handling changes from Sanity's `urlForImage()` builder to plain URL strings already stored in the row (`image_url`, `preview_url`, `portrait_url`).

- [ ] **Step 1: Update `app/layout.tsx`**

Change the import from `@/lib/sanity/queries` to `@/lib/supabase/queries`. No other change needed — `getSiteSettings()` has the same name and is still passed straight to `<Footer settings={settings} />`.

- [ ] **Step 2: Update `components/Footer.tsx`**

Change the type import from `@/lib/sanity/types` to `@/lib/supabase/types`. Field names (`contact_email`, `instagram_url` vs. the old `contactEmail`/`instagramUrl`) need the JSX updated too:

```typescript
import type { SiteSettings } from '@/lib/supabase/types'
import { ThemeToggle } from './ThemeToggle'

export function Footer({ settings }: { settings: SiteSettings | null }) {
  return (
    <footer className="border-t border-border px-6 py-10 text-center text-sm text-muted">
      <p>&copy; {new Date().getFullYear()} HallWay Creative</p>
      <div className="mt-3 flex items-center justify-center gap-6">
        {settings?.contact_email && (
          <a href={`mailto:${settings.contact_email}`} className="transition-colors hover:text-ink">
            {settings.contact_email}
          </a>
        )}
        {settings?.instagram_url && (
          <a
            href={settings.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-ink"
          >
            Instagram
          </a>
        )}
        <ThemeToggle />
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Update `app/page.tsx`**

Change the import to `@/lib/supabase/queries`, and update field references: `category._id` → `category.id`, `settings.heroHeadline` → `settings.hero_headline`, `settings.heroSubtext` → `settings.hero_subtext`. The JSX structure and `PlaceholderTile` usage are unchanged.

- [ ] **Step 4: Update `app/portfolio/page.tsx`**

Same swap: import path, `category._id` → `category.id`. No other changes.

- [ ] **Step 5: Update `app/portfolio/[category]/page.tsx`**

Import path swap. `category._id` → `category.id` (passed into `getMediaItemsForCategory`).

- [ ] **Step 6: Update `components/MediaGrid.tsx`**

Type import swap (`@/lib/supabase/types`), `item._id` → `item.id`:

```typescript
import type { MediaItem } from '@/lib/supabase/types'
import { MediaItemCard } from './MediaItemCard'
import { PlaceholderTile } from './PlaceholderTile'

const PLACEHOLDER_COUNT = 6

export function MediaGrid({ items }: { items: MediaItem[] }) {
  const tiles =
    items.length > 0
      ? items.map((item) => <MediaItemCard key={item.id} item={item} />)
      : Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => <PlaceholderTile key={i} />)

  return <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">{tiles}</div>
}
```

- [ ] **Step 7: Update `components/MediaItemCard.tsx`**

The Sanity version had to call `urlForImage(item.image).width(800).height(1000).url()` inside a try/catch because `item.image` was an opaque Sanity asset reference. The Supabase version already stores a plain, ready-to-use URL string in `item.image_url` — the try/catch and `urlForImage` import are no longer needed at all:

```typescript
import Image from 'next/image'
import { getVideoEmbedUrl } from '@/lib/video'
import type { MediaItem } from '@/lib/supabase/types'

export function MediaItemCard({ item }: { item: MediaItem }) {
  if (item.media_type === 'video') {
    const embedUrl = item.video_url ? getVideoEmbedUrl(item.video_url) : null
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xs bg-surface">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={item.caption || 'Video'}
            className="h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">Video unavailable</div>
        )}
      </div>
    )
  }

  if (!item.image_url) return null

  return (
    <figure className="group m-0">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xs bg-surface">
        <Image
          src={item.image_url}
          alt={item.caption || ''}
          fill
          className="object-cover transition-transform duration-[400ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.02]"
        />
      </div>
      {item.caption && <figcaption className="mt-3 text-lg font-semibold text-ink">{item.caption}</figcaption>}
    </figure>
  )
}
```

- [ ] **Step 8: Update `app/services/page.tsx`**

Import path swap, `service._id` → `service.id`. No other changes.

- [ ] **Step 9: Update `app/about/page.tsx`**

The Sanity version built the portrait URL from an opaque image ref via `urlForImage`. The Supabase version already has a plain `portrait_url` string, so the whole `urlForImage`/try-catch block is deleted:

```typescript
import Image from 'next/image'
import { getAbout } from '@/lib/supabase/queries'

export default async function AboutPage() {
  const about = await getAbout().catch(() => null)

  return (
    <div className="mx-auto max-w-4xl px-6 py-24">
      <h1 className="font-display text-4xl text-ink">About</h1>
      <p className="mt-2 text-lg text-muted">Andrew Hall</p>
      <div className="mt-10 flex flex-col gap-10 sm:flex-row sm:items-start">
        {about?.portrait_url && (
          <div className="relative aspect-[4/5] w-full max-w-sm shrink-0 overflow-hidden rounded-xs bg-surface">
            <Image src={about.portrait_url} alt="Andrew Hall" fill className="object-cover" />
          </div>
        )}
        <p className="whitespace-pre-line text-lg leading-relaxed text-ink">
          {about?.bio || "Andrew's story is coming soon — check back shortly."}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 10: Update the page tests**

Read each test file first, then update its `vi.mock` target from `@/lib/sanity/queries` to `@/lib/supabase/queries` and its fixture data field names to match the new types (`id` instead of `_id`, `sort_order` instead of `order`, `hero_headline`/`hero_subtext`/`contact_email` instead of the camelCase Sanity names, `image_url`/`video_url`/`media_type` instead of `image`/`videoUrl`/`mediaType`). For example, `app/page.test.tsx` becomes:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from './page'
import * as queries from '@/lib/supabase/queries'

vi.mock('@/lib/supabase/queries')

describe('HomePage', () => {
  it('renders the hero headline and category links', async () => {
    vi.mocked(queries.getSiteSettings).mockResolvedValue({
      id: '1',
      hero_headline: 'Moments, captured',
      hero_subtext: null,
      contact_email: 'a@b.com',
      instagram_url: null,
    })
    vi.mocked(queries.getCategories).mockResolvedValue([
      { id: '1', title: 'Sports', slug: 'sports', description: null, sort_order: 0 },
    ])

    render(await HomePage())

    expect(screen.getByText('Moments, captured')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get in touch' })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: /Sports/ })).toHaveAttribute('href', '/portfolio/sports')
  })

  it('shows a fallback message when there are no categories yet', async () => {
    vi.mocked(queries.getSiteSettings).mockResolvedValue(null)
    vi.mocked(queries.getCategories).mockResolvedValue([])

    render(await HomePage())

    expect(screen.getByText('Portfolio categories coming soon.')).toBeInTheDocument()
  })
})
```

Apply the same pattern (mock target + fixture field names) to `app/portfolio/[category]/page.test.tsx`, `app/services/page.test.tsx`, and `app/about/page.test.tsx` — read each one's current fixtures before editing so nothing besides the field names/import path changes.

- [ ] **Step 11: Run the full test suite**

Run: `npm test`
Expected: All tests pass. If any fail, the fixture field names in that test don't match `lib/supabase/types.ts` — fix the fixture, not the type.

- [ ] **Step 12: Commit**

```bash
git add app/layout.tsx app/page.tsx app/page.test.tsx app/portfolio/page.tsx app/portfolio/[category]/page.tsx app/portfolio/[category]/page.test.tsx app/services/page.tsx app/services/page.test.tsx app/about/page.tsx app/about/page.test.tsx components/Footer.tsx components/MediaGrid.tsx components/MediaItemCard.tsx
git commit -m "Rewire public pages from Sanity queries to Supabase queries"
```

---

## Task 6: Admin auth shell

**Files:**
- Create: `middleware.ts`
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/login/LoginForm.tsx`
- Create: `app/admin/auth/callback/route.ts`
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`
- Test: `app/admin/login/LoginForm.test.tsx`

Magic-link auth: the login form calls `supabase.auth.signInWithOtp({ email })`, Supabase emails a link back to `/admin/auth/callback?code=...`, the callback route exchanges that code for a session, and `middleware.ts` protects every other `/admin/*` route.

- [ ] **Step 1: Write the failing test for the login form**

```typescript
// app/admin/login/LoginForm.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'

const signInWithOtp = vi.fn().mockResolvedValue({ error: null })
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithOtp } }),
}))

describe('LoginForm', () => {
  it('sends a magic link and shows a confirmation message', async () => {
    render(<LoginForm />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Email'), 'andrew@example.com')
    await user.click(screen.getByRole('button', { name: 'Send magic link' }))

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'andrew@example.com',
      options: { emailRedirectTo: expect.stringContaining('/admin/auth/callback') },
    })
    expect(await screen.findByText('Check your email for a login link.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- app/admin/login/LoginForm.test.tsx`
Expected: FAIL — `./LoginForm` does not exist yet.

- [ ] **Step 3: Write the login form**

```typescript
// app/admin/login/LoginForm.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin/auth/callback` },
    })
    if (error) {
      setError('Could not send login link. Try again.')
      return
    }
    setSent(true)
  }

  if (sent) {
    return <p className="text-ink">Check your email for a login link.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <label className="ds-field">
        <span className="mb-2 block text-sm font-medium text-muted">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-b border-border bg-transparent py-2 text-ink focus:border-b-2 focus:border-[oklch(0.72_0.09_230)] focus:outline-none"
        />
      </label>
      {error && <p className="text-sm text-[var(--tally-red-text)]">{error}</p>}
      <button type="submit" className="w-fit rounded-xs bg-tally px-6 py-3 font-semibold text-on-accent">
        Send magic link
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- app/admin/login/LoginForm.test.tsx`
Expected: PASS

- [ ] **Step 5: Write the login page**

```typescript
// app/admin/login/page.tsx
import { LoginForm } from './LoginForm'

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <h1 className="font-display text-3xl text-ink">Admin login</h1>
      <p className="mt-2 text-muted">Enter your email for a login link.</p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Write the auth callback route**

```typescript
// app/admin/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/admin`)
}
```

- [ ] **Step 7: Write the middleware protecting `/admin/*`**

```typescript
// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }
  if (request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname.startsWith('/admin/auth/callback')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return response
}

export const config = {
  matcher: '/admin/:path*',
}
```

- [ ] **Step 8: Write the admin layout and landing page**

```typescript
// app/admin/layout.tsx
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-border px-6 py-4">
        <nav className="mx-auto flex max-w-5xl gap-6 text-sm">
          <Link href="/admin" className="font-display text-lg">
            Admin
          </Link>
          <Link href="/admin/content">Content</Link>
          <Link href="/admin/portfolio">Portfolio</Link>
          <Link href="/admin/galleries">Galleries</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  )
}
```

```typescript
// app/admin/page.tsx
export default function AdminHomePage() {
  return <p className="text-muted">Choose a section above.</p>
}
```

- [ ] **Step 9: Run the full test suite**

Run: `npm test`
Expected: All tests pass, including the new `LoginForm.test.tsx`.

- [ ] **Step 10: Commit**

```bash
git add middleware.ts app/admin
git commit -m "Add admin auth shell (magic-link login, session middleware)"
```

---

## Task 7: R2 upload plumbing

**Files:**
- Create: `lib/r2.ts`
- Create: `app/api/r2/presign/route.ts`
- Create: `components/admin/UploadZone.tsx`
- Test: `app/api/r2/presign/route.test.ts`

Shared by both this plan (portfolio media, portrait upload) and the client-gallery plan (gallery photos). One presign endpoint, parameterized by a `prefix` so callers control where in the bucket the object lands (`portfolio/...` vs. `galleries/...`).

- [ ] **Step 1: Write the R2 client**

```typescript
// lib/r2.ts
import { S3Client } from '@aws-sdk/client-s3'

export function createR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}
```

- [ ] **Step 2: Write the failing test for the presign route**

```typescript
// app/api/r2/presign/route.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://r2.example.com/presigned'),
}))

import { createClient } from '@/lib/supabase/server'
import { POST } from './route'

function requestWith(body: unknown) {
  return new Request('http://localhost/api/r2/presign', { method: 'POST', body: JSON.stringify(body) })
}

describe('POST /api/r2/presign', () => {
  it('rejects an unauthenticated request', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as never)

    const response = await POST(requestWith({ filename: 'a.jpg', contentType: 'image/jpeg', prefix: 'portfolio/sports' }))

    expect(response.status).toBe(401)
  })

  it('returns a presigned URL for an authenticated request', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    } as never)

    const response = await POST(requestWith({ filename: 'a.jpg', contentType: 'image/jpeg', prefix: 'portfolio/sports' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.uploadUrl).toBe('https://r2.example.com/presigned')
    expect(body.key).toMatch(/^portfolio\/sports\//)
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test -- app/api/r2/presign/route.test.ts`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 4: Write the presign route**

```typescript
// app/api/r2/presign/route.ts
import { NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createR2Client } from '@/lib/r2'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const { filename, contentType, prefix } = (await request.json()) as {
    filename: string
    contentType: string
    prefix: string
  }

  const key = `${prefix}/${Date.now()}-${filename}`
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  })
  const uploadUrl = await getSignedUrl(createR2Client(), command, { expiresIn: 300 })
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  return NextResponse.json({ uploadUrl, key, publicUrl })
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- app/api/r2/presign/route.test.ts`
Expected: PASS

- [ ] **Step 6: Write the shared upload component**

```typescript
// components/admin/UploadZone.tsx
'use client'

import { useState } from 'react'

export type UploadResult = { key: string; url: string; previewUrl: string; width: number; height: number }

async function downscale(file: File, maxWidth: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85))
}

async function uploadOne(file: Blob, filename: string, contentType: string, prefix: string): Promise<{ key: string; url: string }> {
  const presignResponse = await fetch('/api/r2/presign', {
    method: 'POST',
    body: JSON.stringify({ filename, contentType, prefix }),
  })
  const { uploadUrl, key, publicUrl } = await presignResponse.json()
  await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': contentType } })
  return { key, url: publicUrl }
}

export function UploadZone({ prefix, onUploaded }: { prefix: string; onUploaded: (result: UploadResult) => void }) {
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList) {
    setUploading(true)
    for (const file of Array.from(files)) {
      const bitmap = await createImageBitmap(file)
      const preview = await downscale(file, 1600)
      const original = await uploadOne(file, file.name, file.type, prefix)
      const previewUpload = await uploadOne(preview, `preview-${file.name}`, 'image/jpeg', prefix)
      onUploaded({
        key: original.key,
        url: original.url,
        previewUrl: previewUpload.url,
        width: bitmap.width,
        height: bitmap.height,
      })
    }
    setUploading(false)
  }

  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xs border border-dashed border-border bg-surface p-10 text-center text-muted transition-colors hover:border-tally">
      {uploading ? 'Uploading…' : 'Drop photos here or click to select'}
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </label>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add lib/r2.ts app/api/r2/presign/route.ts app/api/r2/presign/route.test.ts components/admin/UploadZone.tsx
git commit -m "Add R2 presign endpoint and shared upload component"
```

---

## Task 8: Admin — site content editing

**Files:**
- Create: `app/admin/content/page.tsx`
- Create: `app/admin/content/actions.ts`
- Test: `app/admin/content/actions.test.ts`

- [ ] **Step 1: Write the failing test for the update action**

```typescript
// app/admin/content/actions.test.ts
import { describe, it, expect, vi } from 'vitest'

const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ from: () => ({ update }) }),
}))

import { updateSiteSettings } from './actions'

describe('updateSiteSettings', () => {
  it('updates the single site_settings row', async () => {
    await updateSiteSettings('row-1', { hero_headline: 'New headline', hero_subtext: null, contact_email: 'a@b.com', instagram_url: null })

    expect(update).toHaveBeenCalledWith({
      hero_headline: 'New headline',
      hero_subtext: null,
      contact_email: 'a@b.com',
      instagram_url: null,
    })
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- app/admin/content/actions.test.ts`
Expected: FAIL — `./actions` does not exist yet.

- [ ] **Step 3: Write the server actions**

```typescript
// app/admin/content/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import type { SiteSettings, About } from '@/lib/supabase/types'

export async function updateSiteSettings(id: string, fields: Omit<SiteSettings, 'id'>) {
  const { error } = await createServiceClient().from('site_settings').update(fields).eq('id', id)
  if (error) throw error
  revalidatePath('/')
  revalidatePath('/admin/content')
}

export async function updateAbout(id: string, fields: Omit<About, 'id'>) {
  const { error } = await createServiceClient().from('about').update(fields).eq('id', id)
  if (error) throw error
  revalidatePath('/about')
  revalidatePath('/admin/content')
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- app/admin/content/actions.test.ts`
Expected: PASS

- [ ] **Step 5: Write the content editing page**

```typescript
// app/admin/content/page.tsx
import { getSiteSettings, getAbout } from '@/lib/supabase/queries'
import { updateSiteSettings, updateAbout } from './actions'

export default async function AdminContentPage() {
  const [settings, about] = await Promise.all([getSiteSettings(), getAbout()])

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="font-display text-2xl">Site content</h2>
        <form
          action={async (formData) => {
            'use server'
            await updateSiteSettings(settings!.id, {
              hero_headline: formData.get('hero_headline') as string,
              hero_subtext: formData.get('hero_subtext') as string,
              contact_email: formData.get('contact_email') as string,
              instagram_url: formData.get('instagram_url') as string,
            })
          }}
          className="mt-4 flex max-w-xl flex-col gap-4"
        >
          <input name="hero_headline" defaultValue={settings?.hero_headline ?? ''} placeholder="Hero headline" className="border-b border-border bg-transparent py-2" />
          <textarea name="hero_subtext" defaultValue={settings?.hero_subtext ?? ''} placeholder="Hero subtext" className="border-b border-border bg-transparent py-2" />
          <input name="contact_email" defaultValue={settings?.contact_email ?? ''} placeholder="Contact email" className="border-b border-border bg-transparent py-2" />
          <input name="instagram_url" defaultValue={settings?.instagram_url ?? ''} placeholder="Instagram URL" className="border-b border-border bg-transparent py-2" />
          <button type="submit" className="w-fit rounded-xs bg-tally px-6 py-3 font-semibold text-on-accent">
            Save
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-display text-2xl">About</h2>
        <form
          action={async (formData) => {
            'use server'
            await updateAbout(about!.id, {
              bio: formData.get('bio') as string,
              portrait_r2_key: about?.portrait_r2_key ?? null,
              portrait_url: about?.portrait_url ?? null,
            })
          }}
          className="mt-4 flex max-w-xl flex-col gap-4"
        >
          <textarea name="bio" defaultValue={about?.bio ?? ''} placeholder="Bio" rows={6} className="border-b border-border bg-transparent py-2" />
          <button type="submit" className="w-fit rounded-xs bg-tally px-6 py-3 font-semibold text-on-accent">
            Save
          </button>
        </form>
      </section>
    </div>
  )
}
```

Portrait upload via `UploadZone` is intentionally left out of this first pass — bio/hero text is the highest-value edit Andrew needs immediately. Add a follow-up task wiring `UploadZone` into this page if the portrait needs to change before that's prioritized.

- [ ] **Step 6: Commit**

```bash
git add app/admin/content
git commit -m "Add admin site-content editing page"
```

---

## Task 9: Admin — portfolio categories and media

**Files:**
- Create: `app/admin/portfolio/page.tsx`
- Create: `app/admin/portfolio/actions.ts`
- Create: `app/admin/portfolio/[categoryId]/page.tsx`
- Test: `app/admin/portfolio/actions.test.ts`

- [ ] **Step 1: Write the failing test for `createCategory`**

```typescript
// app/admin/portfolio/actions.test.ts
import { describe, it, expect, vi } from 'vitest'

const insert = vi.fn().mockResolvedValue({ error: null })
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ from: () => ({ insert }) }),
}))

import { createCategory } from './actions'

describe('createCategory', () => {
  it('inserts a category with a slugified title', async () => {
    await createCategory('Family Portraits')

    expect(insert).toHaveBeenCalledWith({ title: 'Family Portraits', slug: 'family-portraits', sort_order: 0 })
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- app/admin/portfolio/actions.test.ts`
Expected: FAIL — `./actions` does not exist yet.

- [ ] **Step 3: Write the portfolio admin actions**

```typescript
// app/admin/portfolio/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function createCategory(title: string) {
  const { error } = await createServiceClient().from('categories').insert({ title, slug: slugify(title), sort_order: 0 })
  if (error) throw error
  revalidatePath('/portfolio')
  revalidatePath('/admin/portfolio')
}

export async function addMediaItem(
  categoryId: string,
  fields: { media_type: 'image' | 'video'; r2_key?: string; image_url?: string; preview_url?: string; video_url?: string; caption?: string }
) {
  const { error } = await createServiceClient()
    .from('portfolio_media')
    .insert({ category_id: categoryId, sort_order: 0, ...fields })
  if (error) throw error
  revalidatePath('/portfolio')
}

export async function deleteMediaItem(id: string) {
  const { error } = await createServiceClient().from('portfolio_media').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/portfolio')
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- app/admin/portfolio/actions.test.ts`
Expected: PASS

- [ ] **Step 5: Write the categories list page**

```typescript
// app/admin/portfolio/page.tsx
import Link from 'next/link'
import { getCategories } from '@/lib/supabase/queries'
import { createCategory } from './actions'

export default async function AdminPortfolioPage() {
  const categories = await getCategories()

  return (
    <div>
      <h2 className="font-display text-2xl">Portfolio categories</h2>
      <ul className="mt-6 flex flex-col gap-3">
        {categories.map((category) => (
          <li key={category.id}>
            <Link href={`/admin/portfolio/${category.id}`} className="text-ink hover:text-tally">
              {category.title}
            </Link>
          </li>
        ))}
      </ul>
      <form
        action={async (formData) => {
          'use server'
          await createCategory(formData.get('title') as string)
        }}
        className="mt-8 flex max-w-sm gap-3"
      >
        <input name="title" placeholder="New category title" required className="flex-1 border-b border-border bg-transparent py-2" />
        <button type="submit" className="rounded-xs bg-tally px-4 py-2 font-semibold text-on-accent">
          Add
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 6: Write the per-category media management page**

```typescript
// app/admin/portfolio/[categoryId]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { UploadZone, type UploadResult } from '@/components/admin/UploadZone'
import { addMediaItem, deleteMediaItem } from '../actions'
import type { MediaItem } from '@/lib/supabase/types'

export default function CategoryMediaPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [items, setItems] = useState<MediaItem[]>([])

  useEffect(() => {
    params.then(({ categoryId }) => setCategoryId(categoryId))
  }, [params])

  async function handleUploaded(result: UploadResult) {
    if (!categoryId) return
    await addMediaItem(categoryId, {
      media_type: 'image',
      r2_key: result.key,
      image_url: result.url,
      preview_url: result.previewUrl,
    })
    setItems((current) => [...current, { id: result.key, media_type: 'image', image_url: result.url, preview_url: result.previewUrl, video_url: null, caption: null, sort_order: current.length }])
  }

  if (!categoryId) return null

  return (
    <div>
      <h2 className="font-display text-2xl">Category media</h2>
      <div className="mt-6">
        <UploadZone prefix={`portfolio/${categoryId}`} onUploaded={handleUploaded} />
      </div>
      <ul className="mt-8 grid grid-cols-3 gap-4">
        {items.map((item) => (
          <li key={item.id} className="relative">
            {item.image_url && <img src={item.image_url} alt="" className="aspect-[4/5] w-full rounded-xs object-cover" />}
            <button
              type="button"
              onClick={async () => {
                await deleteMediaItem(item.id)
                setItems((current) => current.filter((i) => i.id !== item.id))
              }}
              className="absolute right-2 top-2 rounded-xs bg-bg/80 px-2 py-1 text-xs text-tally-text"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add app/admin/portfolio
git commit -m "Add admin portfolio category and media management"
```

---

## Task 10: Remove remaining Sanity files and verify

**Files:**
- Delete: `schemaTypes/`, `sanity.config.ts`, `app/studio/`, `lib/sanity/`

- [ ] **Step 1: Delete the Sanity-only files and directories**

```bash
rm -rf schemaTypes sanity.config.ts app/studio lib/sanity
```

- [ ] **Step 2: Search for any remaining references**

```bash
grep -rl "sanity" app components lib --include="*.tsx" --include="*.ts" -i
```

Expected: no output. If anything prints, that file was missed in Task 5 or Task 9 — fix it before continuing.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 4: Run the production build**

Run: `npm run build`
Expected: Clean build, no errors, no remaining `/studio` route in the route list.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Remove Sanity entirely — migration to Supabase complete"
```

---

## Self-Review Notes

- **Spec coverage:** every section of the design doc's "Architecture," "Data model," "Admin dashboard" (content + portfolio halves), and "Migration off Sanity" sections has a corresponding task above. The client-gallery-specific sections (galleries/photos schema, access flow, send-to-client, download-all) are intentionally out of scope for this plan — see `2026-09-17-client-gallery-delivery.md`.
- **Type consistency:** `Category`, `MediaItem`, `Service`, `About`, `SiteSettings` in `lib/supabase/types.ts` (Task 4) are used with identical field names across every query (Task 4), every page (Task 5), and every admin action (Tasks 8–9).
- **Known gap flagged inline rather than hidden:** Task 8 explicitly does not wire portrait image upload into the content-editing form — noted as a deliberate, small follow-up rather than silently dropped.
