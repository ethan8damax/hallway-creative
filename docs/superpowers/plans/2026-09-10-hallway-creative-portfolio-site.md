# HallWay Creative Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the HallWay Creative marketing/portfolio site per `docs/superpowers/specs/2026-09-10-hallway-creative-portfolio-site-design.md` — five pages (Home, Portfolio, Services, About, Contact), a self-serve CMS, and a working contact form — with placeholder media everywhere Andrew's real photos will eventually go.

**Architecture:** Next.js (App Router, TypeScript) on Vercel. Content lives in Sanity (CMS), edited through an embedded Studio at `/studio`. The contact form posts to a Route Handler that sends email via Resend. This plan builds full site structure, content plumbing, and behavior with clean, neutral Tailwind styling — **not** final brand visual design. Andrew's brand identity doesn't exist yet (blank slate per `PROJECT.md`); once the separate Claude-design process produces a visual system, a follow-up pass applies it via `/impeccable`. The QA review loop in this plan checks structure/UX/content clarity against reference sites, not final polish.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Sanity (`sanity`, `next-sanity`, `@sanity/client`, `@sanity/image-url`), Resend, Vitest + React Testing Library.

---

## File Structure

```
app/
  layout.tsx                    Root layout: Header, Footer, global fonts/styles
  page.tsx                      Home page
  portfolio/page.tsx            Portfolio index (category list)
  portfolio/[category]/page.tsx Category gallery page
  services/page.tsx             Services page
  about/page.tsx                About page
  contact/page.tsx              Contact page
  api/contact/route.ts          Contact form submission handler (Resend)
  studio/[[...tool]]/page.tsx   Embedded Sanity Studio
components/
  Header.tsx
  Footer.tsx
  MediaGrid.tsx                 Renders MediaItemCards or placeholder tiles
  MediaItemCard.tsx             Renders one image or video embed
  PlaceholderTile.tsx           Filler tile shown when a category has no media yet
  ContactForm.tsx                Client-side form + validation UI
lib/
  sanity/client.ts               Sanity client config
  sanity/image.ts                Sanity image URL builder
  sanity/types.ts                Shared content types
  sanity/queries.ts              Typed GROQ query functions
  video.ts                       Vimeo/YouTube URL -> embed URL parsing
  validateContactForm.ts         Shared form validation (used by client form + API route)
schemaTypes/
  category.ts, mediaItem.ts, service.ts, about.ts, siteSettings.ts, index.ts
sanity.config.ts                 Sanity Studio config
vitest.config.ts, vitest.setup.ts
```

---

### Task 1: Scaffold the Next.js app

**Files:**
- Create: entire Next.js project at repo root (merged in from a scratch scaffold)

- [ ] **Step 1: Scaffold into a scratch directory**

The repo root already has `PROJECT.md` and `docs/`, which `create-next-app` will refuse to run into directly. Scaffold elsewhere and merge.

Run:
```bash
npx --yes create-next-app@latest hallway-scaffold --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes
```
(run this from the scratchpad directory, or any scratch location outside the repo)

- [ ] **Step 2: Merge scaffold into the repo root**

```bash
rsync -a --exclude='.git' hallway-scaffold/ /Users/ethan2damax/Desktop/Projects/HallWayCreative/
rm -rf hallway-scaffold
```

- [ ] **Step 3: Verify the dev server runs**

Run: `cd /Users/ethan2damax/Desktop/Projects/HallWayCreative && npm run dev`
Expected: server starts on `http://localhost:3000`, default Next.js page loads. Stop the server (Ctrl+C) once confirmed.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Scaffold Next.js app (TypeScript, Tailwind, App Router)"
```

---

### Task 2: Testing tooling

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json` (add `test` script)
- Test: `lib/sanity/types.test.ts` (trivial sanity check that the toolchain works)

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 3: Write `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Add the test script to `package.json`**

Add under `"scripts"`: `"test": "vitest run"`

- [ ] **Step 5: Write a trivial smoke test to confirm the toolchain works**

`lib/sanity/types.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('test toolchain', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Run it**

Run: `npm test`
Expected: PASS, 1 test.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add Vitest + React Testing Library setup"
```

---

### Task 3: Provision Sanity and Resend via the Vercel marketplace

**Files:**
- Create: `.env.local` (not committed — verify `.gitignore` covers it)
- Modify: `PROJECT.md` (resolve the CMS/email vendor open items)

- [ ] **Step 1: Link the Vercel project**

```bash
vercel link --yes
```
If not logged in, run `vercel login` first and complete the browser prompt.

- [ ] **Step 2: Install the Sanity integration**

```bash
vercel integration add sanity/project --yes --no-claim
```
If this requires a dashboard/browser step to connect a Sanity account, complete it, then continue.

- [ ] **Step 3: Install the Resend integration**

```bash
vercel integration add resend/resend-email --yes --no-claim
```
Complete any required browser step.

- [ ] **Step 4: Pull env vars and normalize their names**

```bash
vercel env pull --yes
cat .env.local
```
Whatever the integrations name their variables, add these normalized entries to `.env.local` (mapping from the pulled values) so the rest of the codebase has stable names regardless of vendor-specific naming:
```
NEXT_PUBLIC_SANITY_PROJECT_ID=<value from pulled Sanity project id var>
NEXT_PUBLIC_SANITY_DATASET=production
RESEND_API_KEY=<value from pulled Resend API key var>
CONTACT_TO_EMAIL=<Andrew's email address>
CONTACT_FROM_EMAIL=HallWay Creative <onboarding@resend.dev>
```
`CONTACT_FROM_EMAIL` uses Resend's shared test domain for now — the domain `hallwaycreative.com` isn't registered yet (tracked in `PROJECT.md`). Once it is registered and verified in Resend, update this to `contact@hallwaycreative.com`.

- [ ] **Step 5: Verify `.env.local` is gitignored**

Run: `grep -n "\.env" .gitignore`
Expected: `.env*.local` (or equivalent) is present — `create-next-app` includes this by default.

- [ ] **Step 6: Update `PROJECT.md` open items**

Replace the "CMS vendor selection" and "Transactional email vendor selection" bullets in `PROJECT.md`'s Open Questions section with: "CMS: Sanity (provisioned via Vercel marketplace)." and "Transactional email: Resend (provisioned via Vercel marketplace)."

- [ ] **Step 7: Commit**

```bash
git add PROJECT.md
git commit -m "Provision Sanity and Resend via Vercel marketplace"
```
(`.env.local` is gitignored and won't be included.)

---

### Task 4: Sanity schema and embedded Studio

**Files:**
- Create: `schemaTypes/category.ts`
- Create: `schemaTypes/mediaItem.ts`
- Create: `schemaTypes/service.ts`
- Create: `schemaTypes/about.ts`
- Create: `schemaTypes/siteSettings.ts`
- Create: `schemaTypes/index.ts`
- Create: `sanity.config.ts`
- Create: `app/studio/[[...tool]]/page.tsx`

- [ ] **Step 1: Install Sanity packages**

```bash
npm install sanity next-sanity @sanity/vision @sanity/client @sanity/image-url
```

- [ ] **Step 2: Write the schema files**

`schemaTypes/category.ts`:
```ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'category',
  title: 'Portfolio Category',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (Rule) => Rule.required() }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'order', title: 'Display Order', type: 'number', initialValue: 0 }),
  ],
})
```

`schemaTypes/mediaItem.ts`:
```ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'mediaItem',
  title: 'Media Item',
  type: 'document',
  fields: [
    defineField({ name: 'category', title: 'Category', type: 'reference', to: [{ type: 'category' }], validation: (Rule) => Rule.required() }),
    defineField({
      name: 'mediaType',
      title: 'Media Type',
      type: 'string',
      options: { list: [{ title: 'Image', value: 'image' }, { title: 'Video', value: 'video' }] },
      initialValue: 'image',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'image', title: 'Image', type: 'image', hidden: ({ parent }) => parent?.mediaType !== 'image' }),
    defineField({ name: 'videoUrl', title: 'Video URL (Vimeo or YouTube)', type: 'url', hidden: ({ parent }) => parent?.mediaType !== 'video' }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({ name: 'order', title: 'Display Order', type: 'number', initialValue: 0 }),
  ],
})
```

`schemaTypes/service.ts`:
```ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'description', title: 'Description', type: 'text', validation: (Rule) => Rule.required() }),
    defineField({ name: 'category', title: 'Related Category', type: 'reference', to: [{ type: 'category' }] }),
    defineField({ name: 'order', title: 'Display Order', type: 'number', initialValue: 0 }),
  ],
})
```

`schemaTypes/about.ts`:
```ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'about',
  title: 'About Page',
  type: 'document',
  fields: [
    defineField({ name: 'bio', title: 'Bio', type: 'text', validation: (Rule) => Rule.required() }),
    defineField({ name: 'portrait', title: 'Portrait Photo', type: 'image' }),
  ],
})
```

`schemaTypes/siteSettings.ts`:
```ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'heroHeadline', title: 'Hero Headline', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'heroSubtext', title: 'Hero Subtext', type: 'text' }),
    defineField({ name: 'contactEmail', title: 'Contact Email', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'instagramUrl', title: 'Instagram URL', type: 'url' }),
  ],
})
```

`schemaTypes/index.ts`:
```ts
import category from './category'
import mediaItem from './mediaItem'
import service from './service'
import about from './about'
import siteSettings from './siteSettings'

export const schemaTypes = [category, mediaItem, service, about, siteSettings]
```

- [ ] **Step 3: Write `sanity.config.ts`**

```ts
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'HallWay Creative',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  plugins: [structureTool(), visionTool()],
  schema: { types: schemaTypes },
})
```

- [ ] **Step 4: Write the embedded Studio route**

`app/studio/[[...tool]]/page.tsx`:
```tsx
'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '@/sanity.config'

export const dynamic = 'force-static'

export default function StudioPage() {
  return <NextStudio config={config} />
}
```

- [ ] **Step 5: Verify the Studio loads**

Run: `npm run dev`, visit `http://localhost:3000/studio`.
Expected: Sanity Studio UI loads, showing the 5 document types in the sidebar. Log in with the Sanity account connected in Task 3 if prompted.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add Sanity schema and embedded Studio"
```

---

### Task 5: Sanity client, types, and query functions

**Files:**
- Create: `lib/sanity/client.ts`
- Create: `lib/sanity/image.ts`
- Create: `lib/sanity/types.ts`
- Create: `lib/sanity/queries.ts`
- Test: `lib/sanity/queries.test.ts`

- [ ] **Step 1: Write `lib/sanity/client.ts`**

```ts
import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-01-01',
  useCdn: true,
})
```

- [ ] **Step 2: Write `lib/sanity/image.ts`**

```ts
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'
import { sanityClient } from './client'

const builder = imageUrlBuilder(sanityClient)

export function urlForImage(source: SanityImageSource) {
  return builder.image(source)
}
```

- [ ] **Step 3: Write `lib/sanity/types.ts`**

```ts
export type Category = {
  _id: string
  title: string
  slug: string
  description?: string
  order: number
}

export type MediaItem = {
  _id: string
  mediaType: 'image' | 'video'
  image?: unknown
  videoUrl?: string
  caption?: string
  order: number
}

export type Service = {
  _id: string
  title: string
  description: string
  order: number
}

export type About = {
  bio: string
  portrait?: unknown
}

export type SiteSettings = {
  heroHeadline: string
  heroSubtext?: string
  contactEmail: string
  instagramUrl?: string
}
```

- [ ] **Step 4: Write `lib/sanity/queries.ts`**

```ts
import { sanityClient } from './client'
import type { Category, MediaItem, Service, About, SiteSettings } from './types'

export async function getCategories(): Promise<Category[]> {
  return sanityClient.fetch(
    `*[_type == "category"] | order(order asc) { _id, title, "slug": slug.current, description, order }`
  )
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return sanityClient.fetch(
    `*[_type == "category" && slug.current == $slug][0] { _id, title, "slug": slug.current, description, order }`,
    { slug }
  )
}

export async function getMediaItemsForCategory(categoryId: string): Promise<MediaItem[]> {
  return sanityClient.fetch(
    `*[_type == "mediaItem" && category._ref == $categoryId] | order(order asc) { _id, mediaType, image, videoUrl, caption, order }`,
    { categoryId }
  )
}

export async function getServices(): Promise<Service[]> {
  return sanityClient.fetch(`*[_type == "service"] | order(order asc) { _id, title, description, order }`)
}

export async function getAbout(): Promise<About | null> {
  return sanityClient.fetch(`*[_type == "about"][0] { bio, portrait }`)
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return sanityClient.fetch(`*[_type == "siteSettings"][0] { heroHeadline, heroSubtext, contactEmail, instagramUrl }`)
}
```

- [ ] **Step 5: Write failing tests for the query functions that take parameters**

`lib/sanity/queries.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { sanityClient } from './client'
import { getCategoryBySlug, getMediaItemsForCategory } from './queries'

vi.mock('./client', () => ({
  sanityClient: { fetch: vi.fn() },
}))

describe('getCategoryBySlug', () => {
  it('passes the slug as a query parameter', async () => {
    vi.mocked(sanityClient.fetch).mockResolvedValue({ _id: '1', title: 'Sports', slug: 'sports', order: 0 })

    const result = await getCategoryBySlug('sports')

    expect(sanityClient.fetch).toHaveBeenCalledWith(expect.stringContaining('slug.current == $slug'), { slug: 'sports' })
    expect(result?.title).toBe('Sports')
  })
})

describe('getMediaItemsForCategory', () => {
  it('passes the category id as a query parameter', async () => {
    vi.mocked(sanityClient.fetch).mockResolvedValue([])

    const result = await getMediaItemsForCategory('cat-1')

    expect(sanityClient.fetch).toHaveBeenCalledWith(expect.stringContaining('category._ref == $categoryId'), { categoryId: 'cat-1' })
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 6: Run the tests**

Run: `npm test`
Expected: PASS, both tests green.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add Sanity client, types, and query functions"
```

---

### Task 6: Video embed URL parsing

**Files:**
- Create: `lib/video.ts`
- Test: `lib/video.test.ts`

- [ ] **Step 1: Write the failing tests**

`lib/video.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { getVideoEmbedUrl } from './video'

describe('getVideoEmbedUrl', () => {
  it('converts a youtube.com/watch URL', () => {
    expect(getVideoEmbedUrl('https://www.youtube.com/watch?v=abc123')).toBe('https://www.youtube.com/embed/abc123')
  })

  it('converts a youtu.be short URL', () => {
    expect(getVideoEmbedUrl('https://youtu.be/abc123')).toBe('https://www.youtube.com/embed/abc123')
  })

  it('converts a vimeo.com URL', () => {
    expect(getVideoEmbedUrl('https://vimeo.com/123456789')).toBe('https://player.vimeo.com/video/123456789')
  })

  it('returns null for an unrecognized host', () => {
    expect(getVideoEmbedUrl('https://example.com/video')).toBeNull()
  })

  it('returns null for an invalid URL', () => {
    expect(getVideoEmbedUrl('not a url')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `lib/video.ts` doesn't exist yet.

- [ ] **Step 3: Write `lib/video.ts`**

```ts
export function getVideoEmbedUrl(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
    const videoId = parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v')
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }

  if (parsed.hostname.includes('vimeo.com')) {
    const videoId = parsed.pathname.split('/').filter(Boolean).pop()
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null
  }

  return null
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add Vimeo/YouTube embed URL parsing"
```

---

### Task 7: Header, Footer, and root layout

**Files:**
- Create: `components/Header.tsx`
- Create: `components/Footer.tsx`
- Modify: `app/layout.tsx`
- Test: `components/Footer.test.tsx`

- [ ] **Step 1: Write `components/Header.tsx`**

```tsx
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function Header() {
  return (
    <header className="border-b border-neutral-200">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold">HallWay Creative</Link>
        <ul className="flex gap-6 text-sm">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
```

- [ ] **Step 2: Write the failing test for `Footer`**

`components/Footer.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from './Footer'

describe('Footer', () => {
  it('renders contact email and instagram link when settings are present', () => {
    render(<Footer settings={{ heroHeadline: 'x', contactEmail: 'andrew@example.com', instagramUrl: 'https://instagram.com/ahall.02' }} />)

    expect(screen.getByText('andrew@example.com')).toBeInTheDocument()
    expect(screen.getByText('Instagram')).toBeInTheDocument()
  })

  it('renders without links when settings are null', () => {
    render(<Footer settings={null} />)

    expect(screen.queryByText('Instagram')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `components/Footer.tsx` doesn't exist yet.

- [ ] **Step 4: Write `components/Footer.tsx`**

```tsx
import type { SiteSettings } from '@/lib/sanity/types'

export function Footer({ settings }: { settings: SiteSettings | null }) {
  return (
    <footer className="border-t border-neutral-200 py-8 text-center text-sm text-neutral-500">
      <p>&copy; {new Date().getFullYear()} HallWay Creative</p>
      <div className="mt-2 flex justify-center gap-4">
        {settings?.contactEmail && <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>}
        {settings?.instagramUrl && (
          <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a>
        )}
      </div>
    </footer>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, 2 tests green.

- [ ] **Step 6: Wire Header and Footer into the root layout**

Replace the contents of `app/layout.tsx` with:
```tsx
import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { getSiteSettings } from '@/lib/sanity/queries'

export const metadata: Metadata = {
  title: 'HallWay Creative',
  description: 'Photography and videography by Andrew Hall.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} />
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Verify the app still runs**

Run: `npm run dev`, visit `http://localhost:3000`.
Expected: page loads with nav header and footer, no console errors (a missing Sanity `siteSettings` document just means the footer renders without links — expected until Task 14 seeds content).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Add Header, Footer, and wire into root layout"
```

---

### Task 8: Home page

**Files:**
- Create: `app/page.tsx` (replace scaffold default)
- Test: `app/page.test.tsx`

- [ ] **Step 1: Write the failing test**

`app/page.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from './page'
import * as queries from '@/lib/sanity/queries'

vi.mock('@/lib/sanity/queries')

describe('HomePage', () => {
  it('renders the hero headline and category links', async () => {
    vi.mocked(queries.getSiteSettings).mockResolvedValue({ heroHeadline: 'Moments, captured', contactEmail: 'a@b.com' })
    vi.mocked(queries.getCategories).mockResolvedValue([
      { _id: '1', title: 'Sports', slug: 'sports', order: 0 },
    ])

    render(await HomePage())

    expect(screen.getByText('Moments, captured')).toBeInTheDocument()
    expect(screen.getByText('Sports')).toBeInTheDocument()
  })

  it('shows a fallback message when there are no categories yet', async () => {
    vi.mocked(queries.getSiteSettings).mockResolvedValue(null)
    vi.mocked(queries.getCategories).mockResolvedValue([])

    render(await HomePage())

    expect(screen.getByText('Portfolio categories coming soon.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — current `app/page.tsx` is still the scaffold default.

- [ ] **Step 3: Write `app/page.tsx`**

```tsx
import Link from 'next/link'
import { getCategories, getSiteSettings } from '@/lib/sanity/queries'

export default async function HomePage() {
  const [settings, categories] = await Promise.all([getSiteSettings(), getCategories()])

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <section className="text-center">
        <h1 className="text-4xl font-semibold">{settings?.heroHeadline || 'HallWay Creative'}</h1>
        {settings?.heroSubtext && <p className="mt-4 text-lg text-neutral-600">{settings.heroSubtext}</p>}
        <Link href="/contact" className="mt-8 inline-block rounded-md bg-neutral-900 px-6 py-3 text-white">
          Get in touch
        </Link>
      </section>

      <section className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {categories.length > 0 ? (
          categories.map((category) => (
            <Link key={category._id} href={`/portfolio/${category.slug}`} className="rounded-md border border-neutral-200 p-6 text-center hover:border-neutral-400">
              <h2 className="text-lg font-medium">{category.title}</h2>
            </Link>
          ))
        ) : (
          <p className="col-span-full text-center text-neutral-400">Portfolio categories coming soon.</p>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, both tests green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add Home page"
```

- [ ] **Step 6: Dispatch a QA critic review of the Home page**

Run `npm run dev`. Use the Agent tool to dispatch a fresh general-purpose sub-agent with this prompt:

```
Review the Home page of the HallWay Creative site at http://localhost:3000/ (if Chrome
browser automation tools are available, navigate there and take a screenshot for a real
visual check; otherwise review app/page.tsx and reason about the rendered structure).

Compare it structurally and in tone against professional photography portfolio sites
(Format, Pic-Time, top-tier Squarespace photography templates): a clear hero message, an
obvious path into the portfolio, an uncluttered layout, professional copy tone. Final
branding/visual polish (colors, custom typography, imagery treatment) is intentionally out
of scope for this pass — judge structure, information hierarchy, and content clarity only,
not final aesthetics.

Report PASS or FAIL with specific, actionable reasons. If FAIL, name the exact change needed.
```

If the critic reports FAIL, apply the named fix, re-run `npm test`, commit the fix, and re-dispatch the same review before starting Task 9.

---

### Task 9: Portfolio pages and media gallery

**Files:**
- Create: `components/PlaceholderTile.tsx`
- Create: `components/MediaItemCard.tsx`
- Create: `components/MediaGrid.tsx`
- Create: `app/portfolio/page.tsx`
- Create: `app/portfolio/[category]/page.tsx`
- Test: `components/MediaGrid.test.tsx`
- Test: `app/portfolio/[category]/page.test.tsx`

- [ ] **Step 1: Write the failing test for `MediaGrid`**

`components/MediaGrid.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MediaGrid } from './MediaGrid'

describe('MediaGrid', () => {
  it('renders 6 placeholder tiles when there are no items', () => {
    render(<MediaGrid items={[]} />)

    expect(screen.getAllByText('Photo coming soon')).toHaveLength(6)
  })

  it('renders no placeholder tiles when items are present', () => {
    render(<MediaGrid items={[{ _id: '1', mediaType: 'image', image: {}, order: 0 }]} />)

    expect(screen.queryByText('Photo coming soon')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — none of these components exist yet.

- [ ] **Step 3: Write `components/PlaceholderTile.tsx`**

```tsx
export function PlaceholderTile() {
  return (
    <div className="flex aspect-[4/5] w-full items-center justify-center rounded-md border border-dashed border-neutral-300 bg-neutral-100 text-sm text-neutral-400">
      Photo coming soon
    </div>
  )
}
```

- [ ] **Step 4: Write `components/MediaItemCard.tsx`**

```tsx
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity/image'
import { getVideoEmbedUrl } from '@/lib/video'
import type { MediaItem } from '@/lib/sanity/types'

export function MediaItemCard({ item }: { item: MediaItem }) {
  if (item.mediaType === 'video' && item.videoUrl) {
    const embedUrl = getVideoEmbedUrl(item.videoUrl)
    return (
      <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
        {embedUrl ? (
          <iframe src={embedUrl} title={item.caption || 'Video'} className="h-full w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">Video unavailable</div>
        )}
      </div>
    )
  }

  if (item.image) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md">
        <Image src={urlForImage(item.image).width(800).height(1000).url()} alt={item.caption || ''} fill className="object-cover" />
      </div>
    )
  }

  return null
}
```

- [ ] **Step 5: Write `components/MediaGrid.tsx`**

```tsx
import type { MediaItem } from '@/lib/sanity/types'
import { MediaItemCard } from './MediaItemCard'
import { PlaceholderTile } from './PlaceholderTile'

const PLACEHOLDER_COUNT = 6

export function MediaGrid({ items }: { items: MediaItem[] }) {
  const tiles =
    items.length > 0
      ? items.map((item) => <MediaItemCard key={item._id} item={item} />)
      : Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => <PlaceholderTile key={i} />)

  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{tiles}</div>
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test`
Expected: PASS for `MediaGrid.test.tsx`.

- [ ] **Step 7: Write `app/portfolio/page.tsx`**

```tsx
import Link from 'next/link'
import { getCategories } from '@/lib/sanity/queries'

export default async function PortfolioPage() {
  const categories = await getCategories()

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Portfolio</h1>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {categories.length > 0 ? (
          categories.map((category) => (
            <Link key={category._id} href={`/portfolio/${category.slug}`} className="rounded-md border border-neutral-200 p-6">
              <h2 className="text-lg font-medium">{category.title}</h2>
              {category.description && <p className="mt-2 text-sm text-neutral-600">{category.description}</p>}
            </Link>
          ))
        ) : (
          <p className="col-span-full text-neutral-400">No categories yet.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Write the failing test for the category detail page**

`app/portfolio/[category]/page.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CategoryPage from './page'
import * as queries from '@/lib/sanity/queries'

vi.mock('@/lib/sanity/queries')

describe('CategoryPage', () => {
  it('renders the category title and media grid', async () => {
    vi.mocked(queries.getCategoryBySlug).mockResolvedValue({ _id: '1', title: 'Sports', slug: 'sports', order: 0 })
    vi.mocked(queries.getMediaItemsForCategory).mockResolvedValue([])

    render(await CategoryPage({ params: Promise.resolve({ category: 'sports' }) }))

    expect(screen.getByText('Sports')).toBeInTheDocument()
    expect(screen.getAllByText('Photo coming soon')).toHaveLength(6)
  })

  it('throws (triggers notFound) for an unknown category', async () => {
    vi.mocked(queries.getCategoryBySlug).mockResolvedValue(null)

    await expect(CategoryPage({ params: Promise.resolve({ category: 'nope' }) })).rejects.toThrow()
  })
})
```

- [ ] **Step 9: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `app/portfolio/[category]/page.tsx` doesn't exist yet.

- [ ] **Step 10: Write `app/portfolio/[category]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { getCategoryBySlug, getMediaItemsForCategory } from '@/lib/sanity/queries'
import { MediaGrid } from '@/components/MediaGrid'

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const items = await getMediaItemsForCategory(category._id)

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-semibold">{category.title}</h1>
      {category.description && <p className="mt-2 text-neutral-600">{category.description}</p>}
      <div className="mt-8">
        <MediaGrid items={items} />
      </div>
    </div>
  )
}
```

- [ ] **Step 11: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, all tests in this task green.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "Add Portfolio pages with media gallery and placeholder tiles"
```

- [ ] **Step 13: Dispatch a QA critic review of the Portfolio pages**

Same process as Task 8, Step 6, reviewing `http://localhost:3000/portfolio` and a category page (e.g. `/portfolio/sports` once seeded in Task 14 — for now, review the empty-state gallery layout). Focus the critic prompt on: does the placeholder gallery read as "content coming soon," not "broken page"; is the grid layout consistent with professional gallery conventions (Format, Pic-Time). Loop on FAIL as in Task 8.

---

### Task 10: Services page

**Files:**
- Create: `app/services/page.tsx`
- Test: `app/services/page.test.tsx`

- [ ] **Step 1: Write the failing test**

`app/services/page.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ServicesPage from './page'
import * as queries from '@/lib/sanity/queries'

vi.mock('@/lib/sanity/queries')

describe('ServicesPage', () => {
  it('renders service titles and descriptions', async () => {
    vi.mocked(queries.getServices).mockResolvedValue([
      { _id: '1', title: 'Wedding Photography', description: 'Full-day coverage.', order: 0 },
    ])

    render(await ServicesPage())

    expect(screen.getByText('Wedding Photography')).toBeInTheDocument()
    expect(screen.getByText('Full-day coverage.')).toBeInTheDocument()
  })

  it('shows a fallback message when there are no services yet', async () => {
    vi.mocked(queries.getServices).mockResolvedValue([])

    render(await ServicesPage())

    expect(screen.getByText('Services coming soon.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `app/services/page.tsx` doesn't exist yet.

- [ ] **Step 3: Write `app/services/page.tsx`**

```tsx
import { getServices } from '@/lib/sanity/queries'

export default async function ServicesPage() {
  const services = await getServices()

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Services</h1>
      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
        {services.length > 0 ? (
          services.map((service) => (
            <div key={service._id}>
              <h2 className="text-xl font-medium">{service.title}</h2>
              <p className="mt-2 text-neutral-600">{service.description}</p>
            </div>
          ))
        ) : (
          <p className="col-span-full text-neutral-400">Services coming soon.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, both tests green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add Services page"
```

- [ ] **Step 6: Dispatch a QA critic review of the Services page**

Same process as Task 8, Step 6, reviewing `http://localhost:3000/services`. Focus on: is the offering list scannable and credible, does copy tone match "simple, professional" without sounding like generic template copy.

---

### Task 11: About page

**Files:**
- Create: `app/about/page.tsx`
- Test: `app/about/page.test.tsx`

- [ ] **Step 1: Write the failing test**

`app/about/page.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AboutPage from './page'
import * as queries from '@/lib/sanity/queries'

vi.mock('@/lib/sanity/queries')

describe('AboutPage', () => {
  it('renders the bio when present', async () => {
    vi.mocked(queries.getAbout).mockResolvedValue({ bio: 'Andrew has been shooting for 10 years.' })

    render(await AboutPage())

    expect(screen.getByText('Andrew has been shooting for 10 years.')).toBeInTheDocument()
  })

  it('shows a fallback message when there is no bio yet', async () => {
    vi.mocked(queries.getAbout).mockResolvedValue(null)

    render(await AboutPage())

    expect(screen.getByText('Bio coming soon.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `app/about/page.tsx` doesn't exist yet.

- [ ] **Step 3: Write `app/about/page.tsx`**

```tsx
import Image from 'next/image'
import { getAbout } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'

export default async function AboutPage() {
  const about = await getAbout()

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold">About</h1>
      {about?.portrait ? (
        <div className="relative mt-8 aspect-[4/5] w-full max-w-sm overflow-hidden rounded-md">
          <Image src={urlForImage(about.portrait).width(600).height(750).url()} alt="Andrew Hall" fill className="object-cover" />
        </div>
      ) : null}
      <p className="mt-8 whitespace-pre-line text-neutral-700">{about?.bio || 'Bio coming soon.'}</p>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, both tests green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add About page"
```

- [ ] **Step 6: Dispatch a QA critic review of the About page**

Same process as Task 8, Step 6, reviewing `http://localhost:3000/about`. Focus on: does this read as a genuine personal bio section vs. a bare paragraph dump.

---

### Task 12: Contact form

**Files:**
- Create: `lib/validateContactForm.ts`
- Create: `components/ContactForm.tsx`
- Create: `app/contact/page.tsx`
- Test: `lib/validateContactForm.test.ts`
- Test: `components/ContactForm.test.tsx`

- [ ] **Step 1: Write the failing tests for validation**

`lib/validateContactForm.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { validateContactForm } from './validateContactForm'

describe('validateContactForm', () => {
  it('returns no errors for valid data', () => {
    const errors = validateContactForm({ name: 'Jane', email: 'jane@example.com', message: 'Hi Andrew' })
    expect(errors).toEqual({})
  })

  it('flags a missing name', () => {
    const errors = validateContactForm({ name: '', email: 'jane@example.com', message: 'Hi' })
    expect(errors.name).toBeDefined()
  })

  it('flags an invalid email', () => {
    const errors = validateContactForm({ name: 'Jane', email: 'not-an-email', message: 'Hi' })
    expect(errors.email).toBeDefined()
  })

  it('flags a missing message', () => {
    const errors = validateContactForm({ name: 'Jane', email: 'jane@example.com', message: '' })
    expect(errors.message).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `lib/validateContactForm.ts` doesn't exist yet.

- [ ] **Step 3: Write `lib/validateContactForm.ts`**

```ts
export type ContactFormData = {
  name: string
  email: string
  eventType?: string
  message: string
  company?: string
}

export function validateContactForm(data: ContactFormData): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!data.name?.trim()) errors.name = 'Name is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')) errors.email = 'Valid email is required'
  if (!data.message?.trim()) errors.message = 'Message is required'
  return errors
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, 4 tests green.

- [ ] **Step 5: Write the failing tests for `ContactForm`**

`components/ContactForm.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactForm } from './ContactForm'

describe('ContactForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('shows validation errors and does not submit when fields are empty', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('shows a success message when submission succeeds', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)
    const user = userEvent.setup()
    render(<ContactForm />)

    await user.type(screen.getByLabelText(/name/i), 'Jane')
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/message/i), 'Hi Andrew')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Thanks')
  })

  it('shows an error message when submission fails', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)
    const user = userEvent.setup()
    render(<ContactForm />)

    await user.type(screen.getByLabelText(/name/i), 'Jane')
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/message/i), 'Hi Andrew')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })
})
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `components/ContactForm.tsx` doesn't exist yet.

- [ ] **Step 7: Write `components/ContactForm.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { validateContactForm } from '@/lib/validateContactForm'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = {
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      eventType: String(form.get('eventType') || ''),
      message: String(form.get('message') || ''),
      company: String(form.get('company') || ''),
    }

    const validationErrors = validateContactForm(data)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setStatus('submitting')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return <p role="status">Thanks — Andrew will get back to you soon.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <label className="flex flex-col gap-1">
        Name
        <input type="text" name="name" className="rounded-md border border-neutral-300 p-2" />
        {errors.name && <span className="text-sm text-red-600">{errors.name}</span>}
      </label>

      <label className="flex flex-col gap-1">
        Email
        <input type="email" name="email" className="rounded-md border border-neutral-300 p-2" />
        {errors.email && <span className="text-sm text-red-600">{errors.email}</span>}
      </label>

      <label className="flex flex-col gap-1">
        Event type
        <input type="text" name="eventType" className="rounded-md border border-neutral-300 p-2" />
      </label>

      <label className="flex flex-col gap-1">
        Message
        <textarea name="message" rows={5} className="rounded-md border border-neutral-300 p-2" />
        {errors.message && <span className="text-sm text-red-600">{errors.message}</span>}
      </label>

      <button type="submit" disabled={status === 'submitting'} className="rounded-md bg-neutral-900 px-6 py-3 text-white disabled:opacity-50">
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>

      {status === 'error' && (
        <p role="alert" className="text-sm text-red-600">Something went wrong — please email Andrew directly instead.</p>
      )}
    </form>
  )
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, all 3 `ContactForm` tests green.

- [ ] **Step 9: Write `app/contact/page.tsx`**

```tsx
import { ContactForm } from '@/components/ContactForm'

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Contact</h1>
      <p className="mt-2 text-neutral-600">Tell Andrew about your event and he&apos;ll get back to you.</p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  )
}
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Add contact form and Contact page"
```

---

### Task 13: Contact API route

**Files:**
- Create: `app/api/contact/route.ts`
- Test: `app/api/contact/route.test.ts`

- [ ] **Step 1: Install the Resend SDK**

```bash
npm install resend
```

- [ ] **Step 2: Write the failing tests**

`app/api/contact/route.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const sendMock = vi.fn()
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: sendMock } })),
}))

describe('POST /api/contact', () => {
  beforeEach(() => {
    sendMock.mockReset()
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('CONTACT_TO_EMAIL', 'andrew@example.com')
  })

  it('sends an email and returns ok for valid data', async () => {
    sendMock.mockResolvedValue({ data: { id: '1' }, error: null })
    const { POST } = await import('./route')

    const res = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name: 'Jane', email: 'jane@example.com', message: 'Hi', eventType: 'Wedding' }),
      })
    )

    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)
  })

  it('returns 400 with field errors for invalid data', async () => {
    const { POST } = await import('./route')

    const res = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name: '', email: 'not-an-email', message: '' }),
      })
    )

    expect(res.status).toBe(400)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('silently accepts and does not send when the honeypot field is filled', async () => {
    const { POST } = await import('./route')

    const res = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name: 'Bot', email: 'bot@example.com', message: 'spam', company: 'filled' }),
      })
    )

    expect(res.status).toBe(200)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('returns 502 when the email send fails', async () => {
    sendMock.mockRejectedValue(new Error('send failed'))
    const { POST } = await import('./route')

    const res = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name: 'Jane', email: 'jane@example.com', message: 'Hi' }),
      })
    )

    expect(res.status).toBe(502)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `app/api/contact/route.ts` doesn't exist yet.

- [ ] **Step 4: Write `app/api/contact/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { validateContactForm, type ContactFormData } from '@/lib/validateContactForm'

export async function POST(request: Request) {
  const data = (await request.json()) as ContactFormData

  if (data.company) {
    return NextResponse.json({ ok: true })
  }

  const errors = validateContactForm(data)
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 400 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.CONTACT_FROM_EMAIL || 'HallWay Creative <onboarding@resend.dev>'

  try {
    await resend.emails.send({
      from: fromEmail,
      to: process.env.CONTACT_TO_EMAIL!,
      replyTo: data.email,
      subject: `New inquiry from ${data.name}`,
      text: `Name: ${data.name}\nEmail: ${data.email}\nEvent type: ${data.eventType || 'n/a'}\n\n${data.message}`,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to send contact email', error)
    return NextResponse.json({ ok: false, error: 'send_failed' }, { status: 502 })
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, all 4 tests green.

- [ ] **Step 6: Manually verify end-to-end with real credentials**

Run `npm run dev`, visit `http://localhost:3000/contact`, submit the form with real values.
Expected: success message shown, and an email arrives at `CONTACT_TO_EMAIL`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add contact API route with Resend integration"
```

- [ ] **Step 8: Dispatch a QA critic review of the Contact page and flow**

Same process as Task 8, Step 6, reviewing `http://localhost:3000/contact`. Focus on: does the form feel low-friction and trustworthy; are error/success states clear. Also confirm functionally (not just visually) that a real submission was verified in Step 6.

---

### Task 14: Seed initial Sanity content

**Files:** none (content-only, via Sanity Studio UI)

- [ ] **Step 1: Create the three launch categories**

Visit `http://localhost:3000/studio` (or the deployed `/studio` URL). Create 3 `Portfolio Category` documents:
- Title: `Sports`, slug auto-generated as `sports`
- Title: `Weddings`, slug auto-generated as `weddings`
- Title: `Events`, slug auto-generated as `events`

Leave media items empty for now — the site shows placeholder tiles until Andrew provides real photos (per `PROJECT.md`).

- [ ] **Step 2: Create a `Site Settings` document**

Fill in `heroHeadline`, a short `heroSubtext`, `contactEmail` (Andrew's real email), and leave `instagramUrl` blank or set it to `https://www.instagram.com/ahall.02/` if Andrew confirms that's the account to link.

- [ ] **Step 3: Verify the site reflects seeded content**

Run: `npm run dev`, visit `http://localhost:3000`.
Expected: hero headline appears, 3 category cards appear and link to `/portfolio/sports`, `/portfolio/weddings`, `/portfolio/events`, each showing 6 placeholder tiles.

No commit needed — this is CMS content, not code.

---

### Task 15: Final integration pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS, all tests green.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 3: Deploy a preview to Vercel**

```bash
vercel deploy
```
Expected: preview URL returned. Visit it and click through all 5 pages plus `/studio`.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "Complete HallWay Creative portfolio site v1"
```

---

## Not covered by this plan (tracked in `PROJECT.md`)

- Final brand visual design (colors, typography, imagery treatment) — separate Claude-design pass, then a `/impeccable`-driven implementation pass to apply it.
- Domain registration and DNS pointing.
- Client gallery delivery (Subsystem 2) — separate spec and plan.
- Calendar/booking integration (explicitly deferred per the approved spec).
