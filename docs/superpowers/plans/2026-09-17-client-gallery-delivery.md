# Client Gallery Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Andrew deliver a finished shoot to a client as a private, access-code-gated gallery they can view and download from — no Dropbox, no third-party redirect.

**Architecture:** New `galleries`/`photos` tables in the same Supabase project, locked down to zero public API access — every read goes through a server route that has already verified the access code. Clients unlock a gallery with a durable, bcrypt-hashed code; a long-lived cookie remembers the unlock on that device. Andrew manages galleries from `/admin/galleries`, reusing the upload/auth infrastructure from the migration plan, and sends the link+code to the client via the existing Resend integration.

**Tech Stack:** Next.js 16 (App Router), Supabase, Cloudflare R2, `bcryptjs`, `jszip`, Resend, Vitest + Testing Library.

**Depends on:** `2026-09-17-sanity-to-supabase-migration.md` must be complete first. This plan reuses `lib/supabase/service.ts`, `lib/supabase/server.ts`, `components/admin/UploadZone.tsx`, the `/admin` auth shell (`middleware.ts`, `app/admin/layout.tsx`), and the `app/api/r2/presign/route.ts` endpoint built there.

---

## Task 1: Gallery schema

**Files:**
- Create: `supabase/migrations/0002_galleries.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0002_galleries.sql

create table galleries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_name text not null,
  slug text unique not null,
  event_date date,
  access_code_hash text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  r2_key text not null,
  url text not null,
  preview_url text not null,
  width int,
  height int,
  filename text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- No public policies at all: RLS is enabled with zero select/insert/update/delete
-- policies for the anon role, so the public Supabase API can never read or write
-- these tables under any circumstance. Every access — admin mutations, and the
-- gallery page's read after a verified access code — goes through server-only
-- code using the service-role client (lib/supabase/service.ts), which bypasses
-- RLS entirely. This is a stronger guarantee than a permissive-looking policy.
alter table galleries enable row level security;
alter table photos enable row level security;
```

- [ ] **Step 2: Apply it**

Paste into Supabase dashboard → SQL Editor → Run. Confirm both tables appear, and that Table Editor's API preview shows no public read access for either.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0002_galleries.sql
git commit -m "Add Supabase schema for client galleries"
```

---

## Task 2: Access-code hashing and types

**Files:**
- Create: `lib/accessCode.ts`
- Modify: `lib/supabase/types.ts`
- Test: `lib/accessCode.test.ts`

- [ ] **Step 1: Install bcryptjs**

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

- [ ] **Step 2: Write the failing test**

```typescript
// lib/accessCode.test.ts
import { describe, it, expect } from 'vitest'
import { hashAccessCode, verifyAccessCode } from './accessCode'

describe('accessCode', () => {
  it('verifies a matching code and rejects a mismatched one', async () => {
    const hash = await hashAccessCode('sunset-2026')

    expect(await verifyAccessCode('sunset-2026', hash)).toBe(true)
    expect(await verifyAccessCode('wrong-code', hash)).toBe(false)
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test -- lib/accessCode.test.ts`
Expected: FAIL — `./accessCode` does not exist yet.

- [ ] **Step 4: Write the module**

```typescript
// lib/accessCode.ts
import bcrypt from 'bcryptjs'

export async function hashAccessCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10)
}

export async function verifyAccessCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash)
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- lib/accessCode.test.ts`
Expected: PASS

- [ ] **Step 6: Add the types**

Read `lib/supabase/types.ts` first (it was created in the migration plan's Task 4), then append:

```typescript
export type Gallery = {
  id: string
  title: string
  client_name: string
  slug: string
  event_date: string | null
  access_code_hash: string
  status: 'draft' | 'published'
  created_at: string
}

export type Photo = {
  id: string
  gallery_id: string
  r2_key: string
  url: string
  preview_url: string
  width: number | null
  height: number | null
  filename: string | null
  sort_order: number
  created_at: string
}
```

- [ ] **Step 7: Commit**

```bash
git add lib/accessCode.ts lib/accessCode.test.ts lib/supabase/types.ts package.json package-lock.json
git commit -m "Add bcrypt access-code hashing and gallery/photo types"
```

---

## Task 3: Admin — galleries list and create

**Files:**
- Create: `app/admin/galleries/page.tsx`
- Create: `app/admin/galleries/actions.ts`
- Test: `app/admin/galleries/actions.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// app/admin/galleries/actions.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/accessCode', () => ({ hashAccessCode: vi.fn().mockResolvedValue('hashed') }))
const insert = vi.fn().mockResolvedValue({ error: null })
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ from: () => ({ insert }) }),
}))

import { createGallery } from './actions'

describe('createGallery', () => {
  it('slugifies the title and hashes the access code before inserting', async () => {
    await createGallery({ title: 'Sunset Wedding', clientName: 'Jane & Sam', eventDate: '2026-10-01', accessCode: 'sunset-2026' })

    expect(insert).toHaveBeenCalledWith({
      title: 'Sunset Wedding',
      client_name: 'Jane & Sam',
      slug: 'sunset-wedding',
      event_date: '2026-10-01',
      access_code_hash: 'hashed',
      status: 'draft',
    })
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- app/admin/galleries/actions.test.ts`
Expected: FAIL — `./actions` does not exist yet.

- [ ] **Step 3: Write the actions module**

```typescript
// app/admin/galleries/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { hashAccessCode } from '@/lib/accessCode'

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function createGallery(input: { title: string; clientName: string; eventDate: string; accessCode: string }) {
  const access_code_hash = await hashAccessCode(input.accessCode)
  const { error } = await createServiceClient().from('galleries').insert({
    title: input.title,
    client_name: input.clientName,
    slug: slugify(input.title),
    event_date: input.eventDate || null,
    access_code_hash,
    status: 'draft',
  })
  if (error) throw error
  revalidatePath('/admin/galleries')
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- app/admin/galleries/actions.test.ts`
Expected: PASS

- [ ] **Step 5: Write the galleries list page**

```typescript
// app/admin/galleries/page.tsx
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { createGallery } from './actions'
import type { Gallery } from '@/lib/supabase/types'

export default async function AdminGalleriesPage() {
  const { data: galleries } = await createServiceClient()
    .from('galleries')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h2 className="font-display text-2xl">Galleries</h2>
      <ul className="mt-6 flex flex-col gap-3">
        {(galleries as Gallery[] | null)?.map((gallery) => (
          <li key={gallery.id}>
            <Link href={`/admin/galleries/${gallery.id}`} className="text-ink hover:text-tally">
              {gallery.title} — {gallery.client_name} ({gallery.status})
            </Link>
          </li>
        ))}
      </ul>

      <form
        action={async (formData) => {
          'use server'
          await createGallery({
            title: formData.get('title') as string,
            clientName: formData.get('clientName') as string,
            eventDate: formData.get('eventDate') as string,
            accessCode: formData.get('accessCode') as string,
          })
        }}
        className="mt-8 flex max-w-sm flex-col gap-3"
      >
        <input name="title" placeholder="Gallery title" required className="border-b border-border bg-transparent py-2" />
        <input name="clientName" placeholder="Client name" required className="border-b border-border bg-transparent py-2" />
        <input name="eventDate" type="date" className="border-b border-border bg-transparent py-2" />
        <input name="accessCode" placeholder="Access code" required className="border-b border-border bg-transparent py-2" />
        <button type="submit" className="w-fit rounded-xs bg-tally px-6 py-3 font-semibold text-on-accent">
          Create gallery
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add app/admin/galleries/page.tsx app/admin/galleries/actions.ts app/admin/galleries/actions.test.ts
git commit -m "Add admin galleries list and create form"
```

---

## Task 4: Admin — gallery detail (upload, publish, send)

**Files:**
- Create: `app/admin/galleries/[id]/page.tsx`
- Create: `app/admin/galleries/[id]/GalleryEditor.tsx`
- Modify: `app/admin/galleries/actions.ts`
- Test: `app/admin/galleries/actions.test.ts` (extend)

- [ ] **Step 1: Extend the failing test for `addPhoto`, `togglePublish`, and `deletePhoto`**

Append to `app/admin/galleries/actions.test.ts`:

```typescript
describe('addPhoto', () => {
  it('inserts a photo row for the gallery', async () => {
    const { addPhoto } = await import('./actions')
    await addPhoto('gallery-1', { r2_key: 'galleries/g1/a.jpg', url: 'https://r2/a.jpg', preview_url: 'https://r2/a-preview.jpg', width: 1200, height: 1600, filename: 'a.jpg' })

    expect(insert).toHaveBeenCalledWith({
      gallery_id: 'gallery-1',
      r2_key: 'galleries/g1/a.jpg',
      url: 'https://r2/a.jpg',
      preview_url: 'https://r2/a-preview.jpg',
      width: 1200,
      height: 1600,
      filename: 'a.jpg',
      sort_order: 0,
    })
  })
})

describe('togglePublish', () => {
  it('updates the gallery status', async () => {
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    vi.mocked(await import('@/lib/supabase/service')).createServiceClient.mockReturnValue({ from: () => ({ update }) } as never)

    const { togglePublish } = await import('./actions')
    await togglePublish('gallery-1', 'published')

    expect(update).toHaveBeenCalledWith({ status: 'published' })
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- app/admin/galleries/actions.test.ts`
Expected: FAIL — `addPhoto` and `togglePublish` are not exported yet.

- [ ] **Step 3: Add the new actions**

Append to `app/admin/galleries/actions.ts`:

```typescript
export async function addPhoto(
  galleryId: string,
  fields: { r2_key: string; url: string; preview_url: string; width: number; height: number; filename: string }
) {
  const { error } = await createServiceClient().from('photos').insert({ gallery_id: galleryId, sort_order: 0, ...fields })
  if (error) throw error
  revalidatePath(`/admin/galleries/${galleryId}`)
}

export async function deletePhoto(id: string, galleryId: string) {
  const { error } = await createServiceClient().from('photos').delete().eq('id', id)
  if (error) throw error
  revalidatePath(`/admin/galleries/${galleryId}`)
}

export async function togglePublish(id: string, status: 'draft' | 'published') {
  const { error } = await createServiceClient().from('galleries').update({ status }).eq('id', id)
  if (error) throw error
  revalidatePath(`/admin/galleries/${id}`)
  revalidatePath('/admin/galleries')
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- app/admin/galleries/actions.test.ts`
Expected: PASS

- [ ] **Step 5: Write the gallery detail page**

```typescript
// app/admin/galleries/[id]/page.tsx
import { createServiceClient } from '@/lib/supabase/service'
import { GalleryEditor } from './GalleryEditor'
import type { Gallery, Photo } from '@/lib/supabase/types'

export default async function GalleryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const [{ data: gallery }, { data: photos }] = await Promise.all([
    supabase.from('galleries').select('*').eq('id', id).single(),
    supabase.from('photos').select('*').eq('gallery_id', id).order('sort_order', { ascending: true }),
  ])

  return <GalleryEditor gallery={gallery as Gallery} initialPhotos={(photos ?? []) as Photo[]} />
}
```

- [ ] **Step 6: Write the client-side editor**

```typescript
// app/admin/galleries/[id]/GalleryEditor.tsx
'use client'

import { useState } from 'react'
import { UploadZone, type UploadResult } from '@/components/admin/UploadZone'
import { addPhoto, deletePhoto, togglePublish } from '../actions'
import type { Gallery, Photo } from '@/lib/supabase/types'

export function GalleryEditor({ gallery, initialPhotos }: { gallery: Gallery; initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [status, setStatus] = useState(gallery.status)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleUploaded(result: UploadResult) {
    await addPhoto(gallery.id, {
      r2_key: result.key,
      url: result.url,
      preview_url: result.previewUrl,
      width: result.width,
      height: result.height,
      filename: result.key.split('/').pop() ?? 'photo.jpg',
    })
    setPhotos((current) => [
      ...current,
      {
        id: result.key,
        gallery_id: gallery.id,
        r2_key: result.key,
        url: result.url,
        preview_url: result.previewUrl,
        width: result.width,
        height: result.height,
        filename: result.key.split('/').pop() ?? 'photo.jpg',
        sort_order: current.length,
        created_at: new Date().toISOString(),
      },
    ])
  }

  async function handleTogglePublish() {
    const next = status === 'draft' ? 'published' : 'draft'
    await togglePublish(gallery.id, next)
    setStatus(next)
  }

  async function handleSendToClient() {
    setSending(true)
    const response = await fetch(`/api/admin/galleries/${gallery.id}/send`, { method: 'POST' })
    setSending(false)
    setSent(response.ok)
  }

  return (
    <div>
      <h2 className="font-display text-2xl">
        {gallery.title} — {gallery.client_name}
      </h2>
      <p className="mt-1 text-sm text-muted">/gallery/{gallery.slug} · {status}</p>

      <div className="mt-4 flex gap-3">
        <button type="button" onClick={handleTogglePublish} className="rounded-xs border border-border px-4 py-2 text-sm">
          {status === 'draft' ? 'Publish' : 'Unpublish'}
        </button>
        <button
          type="button"
          onClick={handleSendToClient}
          disabled={status === 'draft' || sending}
          className="rounded-xs bg-tally px-4 py-2 text-sm font-semibold text-on-accent disabled:opacity-40"
        >
          {sending ? 'Sending…' : sent ? 'Sent!' : 'Send to client'}
        </button>
      </div>

      <div className="mt-8">
        <UploadZone prefix={`galleries/${gallery.slug}`} onUploaded={handleUploaded} />
      </div>

      <ul className="mt-8 grid grid-cols-3 gap-4">
        {photos.map((photo) => (
          <li key={photo.id} className="relative">
            <img src={photo.preview_url} alt="" className="aspect-[4/5] w-full rounded-xs object-cover" />
            <button
              type="button"
              onClick={async () => {
                await deletePhoto(photo.id, gallery.id)
                setPhotos((current) => current.filter((p) => p.id !== photo.id))
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
git add app/admin/galleries
git commit -m "Add admin gallery detail page: upload, publish, send-to-client trigger"
```

---

## Task 5: Send-to-client email

**Files:**
- Create: `app/api/admin/galleries/[id]/send/route.ts`
- Test: `app/api/admin/galleries/[id]/send/route.test.ts`

Mirrors `app/api/contact/route.ts`'s Resend pattern exactly.

- [ ] **Step 1: Write the failing test**

```typescript
// app/api/admin/galleries/[id]/send/route.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }))

const send = vi.fn().mockResolvedValue({ error: null })
vi.mock('resend', () => ({ Resend: vi.fn().mockImplementation(() => ({ emails: { send } })) }))

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { POST } from './route'

function requestParams() {
  return { params: Promise.resolve({ id: 'gallery-1' }) }
}

describe('POST /api/admin/galleries/[id]/send', () => {
  it('rejects an unauthenticated request', async () => {
    vi.mocked(createClient).mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } } as never)

    const response = await POST(new Request('http://localhost'), requestParams())

    expect(response.status).toBe(401)
  })

  it('emails the client with the gallery link and access code placeholder', async () => {
    vi.mocked(createClient).mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) } } as never)
    vi.mocked(createServiceClient).mockReturnValue({
      from: () => ({
        select: () => ({ eq: () => ({ single: vi.fn().mockResolvedValue({ data: { title: 'Sunset Wedding', client_name: 'Jane', slug: 'sunset-wedding', client_email: 'jane@example.com' }, error: null }) }) }),
      }),
    } as never)

    const response = await POST(new Request('http://localhost'), requestParams())

    expect(response.status).toBe(200)
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'jane@example.com', subject: expect.stringContaining('Sunset Wedding') })
    )
  })
})
```

This test assumes a `client_email` column. Add it now — it's needed to actually send the email and was missing from the Task 1 schema (a gap caught here rather than left as a silent assumption):

- [ ] **Step 2: Add the missing column**

Run in Supabase SQL Editor:

```sql
alter table galleries add column client_email text not null default '';
```

Update `lib/supabase/types.ts`'s `Gallery` type to add `client_email: string` as a field (between `client_name` and `slug`), and update `app/admin/galleries/actions.ts`'s `createGallery` to accept and insert `clientEmail`/`client_email`, and `app/admin/galleries/page.tsx`'s create form to add a `clientEmail` input. Update `app/admin/galleries/actions.test.ts`'s existing `createGallery` test fixture to include `clientEmail: 'jane@example.com'` in the input and `client_email: 'jane@example.com'` in the expected insert call.

- [ ] **Step 3: Run the send-route test to verify it fails**

Run: `npm test -- app/api/admin/galleries/[id]/send/route.test.ts`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 4: Write the send route**

```typescript
// app/api/admin/galleries/[id]/send/route.ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const { id } = await params
  const { data: gallery, error } = await createServiceClient()
    .from('galleries')
    .select('title, client_name, client_email, slug')
    .eq('id', id)
    .single()

  if (error || !gallery) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.CONTACT_FROM_EMAIL || 'HallWay Creative <onboarding@resend.dev>'
  const galleryUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/gallery/${gallery.slug}`

  const { error: sendError } = await resend.emails.send({
    from: fromEmail,
    to: gallery.client_email,
    subject: `Your photos from ${gallery.title} are ready`,
    text: `Hi ${gallery.client_name},\n\nYour gallery from ${gallery.title} is ready to view and download:\n\n${galleryUrl}\n\nAsk Andrew if you need the access code again.`,
  })

  if (sendError) {
    return NextResponse.json({ error: 'send_failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- app/api/admin/galleries/[id]/send/route.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/galleries lib/supabase/types.ts app/admin/galleries/actions.ts app/admin/galleries/actions.test.ts app/admin/galleries/page.tsx
git commit -m "Add send-to-client email via Resend, add client_email to galleries"
```

---

## Task 6: Public unlock route

**Files:**
- Create: `app/api/gallery/[slug]/unlock/route.ts`
- Test: `app/api/gallery/[slug]/unlock/route.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// app/api/gallery/[slug]/unlock/route.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/accessCode', () => ({ verifyAccessCode: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }))

import { verifyAccessCode } from '@/lib/accessCode'
import { createServiceClient } from '@/lib/supabase/service'
import { POST } from './route'

function requestWith(code: string) {
  return new Request('http://localhost', { method: 'POST', body: JSON.stringify({ code }) })
}

function paramsFor(slug: string) {
  return { params: Promise.resolve({ slug }) }
}

describe('POST /api/gallery/[slug]/unlock', () => {
  it('rejects an unknown gallery', async () => {
    vi.mocked(createServiceClient).mockReturnValue({
      from: () => ({ select: () => ({ eq: () => ({ single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }) }) }) }),
    } as never)

    const response = await POST(requestWith('any-code'), paramsFor('unknown-slug'))

    expect(response.status).toBe(404)
  })

  it('rejects a wrong code without setting a cookie', async () => {
    vi.mocked(createServiceClient).mockReturnValue({
      from: () => ({ select: () => ({ eq: () => ({ single: vi.fn().mockResolvedValue({ data: { id: 'g1', access_code_hash: 'hash' }, error: null }) }) }) }),
    } as never)
    vi.mocked(verifyAccessCode).mockResolvedValue(false)

    const response = await POST(requestWith('wrong-code'), paramsFor('sunset-wedding'))

    expect(response.status).toBe(401)
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('sets a long-lived cookie on a correct code', async () => {
    vi.mocked(createServiceClient).mockReturnValue({
      from: () => ({ select: () => ({ eq: () => ({ single: vi.fn().mockResolvedValue({ data: { id: 'g1', access_code_hash: 'hash' }, error: null }) }) }) }),
    } as never)
    vi.mocked(verifyAccessCode).mockResolvedValue(true)

    const response = await POST(requestWith('sunset-2026'), paramsFor('sunset-wedding'))

    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toContain('gallery_access_sunset-wedding=')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- app/api/gallery/[slug]/unlock/route.test.ts`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 3: Write the route**

```typescript
// app/api/gallery/[slug]/unlock/route.ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyAccessCode } from '@/lib/accessCode'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { code } = (await request.json()) as { code: string }

  const { data: gallery, error } = await createServiceClient()
    .from('galleries')
    .select('id, access_code_hash')
    .eq('slug', slug)
    .single()

  if (error || !gallery) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const valid = await verifyAccessCode(code, gallery.access_code_hash)
  if (!valid) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(`gallery_access_${slug}`, 'unlocked', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: ONE_YEAR_SECONDS,
    path: `/gallery/${slug}`,
  })
  return response
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- app/api/gallery/[slug]/unlock/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/gallery
git commit -m "Add public gallery unlock route (bcrypt-verified, long-lived cookie)"
```

---

## Task 7: Public gallery page

**Files:**
- Create: `app/gallery/[slug]/page.tsx`
- Create: `app/gallery/[slug]/UnlockForm.tsx`
- Create: `app/gallery/[slug]/GalleryView.tsx`
- Test: `app/gallery/[slug]/UnlockForm.test.tsx`

- [ ] **Step 1: Write the failing test for the unlock form**

```typescript
// app/gallery/[slug]/UnlockForm.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UnlockForm } from './UnlockForm'

describe('UnlockForm', () => {
  it('shows an error on a rejected code and reloads on success', async () => {
    const reload = vi.fn()
    Object.defineProperty(window, 'location', { value: { reload }, writable: true })
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true })

    render(<UnlockForm slug="sunset-wedding" />)
    const user = userEvent.setup()
    const input = screen.getByLabelText('Access code')
    const button = screen.getByRole('button', { name: 'Unlock' })

    await user.type(input, 'wrong-code')
    await user.click(button)
    expect(await screen.findByText('Incorrect code. Try again.')).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'sunset-2026')
    await user.click(button)
    expect(reload).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- app/gallery/[slug]/UnlockForm.test.tsx`
Expected: FAIL — `./UnlockForm` does not exist yet.

- [ ] **Step 3: Write the unlock form**

```typescript
// app/gallery/[slug]/UnlockForm.tsx
'use client'

import { useState } from 'react'

export function UnlockForm({ slug }: { slug: string }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(false)
    const response = await fetch(`/api/gallery/${slug}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
    if (!response.ok) {
      setError(true)
      return
    }
    window.location.reload()
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-24">
      <label htmlFor="access-code" className="text-sm font-medium text-muted">
        Access code
      </label>
      <input
        id="access-code"
        aria-label="Access code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="border-b border-border bg-transparent py-2 text-ink focus:outline-none"
      />
      {error && <p className="text-sm text-[var(--tally-red-text)]">Incorrect code. Try again.</p>}
      <button type="submit" className="w-fit rounded-xs bg-tally px-6 py-3 font-semibold text-on-accent">
        Unlock
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- app/gallery/[slug]/UnlockForm.test.tsx`
Expected: PASS

- [ ] **Step 5: Write the gallery view (grid + lightbox + per-photo download)**

```typescript
// app/gallery/[slug]/GalleryView.tsx
'use client'

import { useState } from 'react'
import type { Photo } from '@/lib/supabase/types'
import { DownloadAllButton } from './DownloadAllButton'

export function GalleryView({ title, photos }: { title: string; photos: Photo[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-ink">{title}</h1>
        <DownloadAllButton photos={photos} title={title} />
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <button key={photo.id} type="button" onClick={() => setOpenIndex(index)} className="block">
            <img src={photo.preview_url} alt="" className="aspect-[4/5] w-full rounded-xs object-cover" />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 p-6" onClick={() => setOpenIndex(null)}>
          <img src={photos[openIndex].preview_url} alt="" className="max-h-[85vh] max-w-full" onClick={(e) => e.stopPropagation()} />
          <a
            href={photos[openIndex].url}
            download
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-6 right-6 rounded-xs bg-tally px-4 py-2 text-sm font-semibold text-on-accent"
          >
            Download
          </a>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Write the page (draft 404, locked/unlocked branch)**

```typescript
// app/gallery/[slug]/page.tsx
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { UnlockForm } from './UnlockForm'
import { GalleryView } from './GalleryView'
import type { Gallery, Photo } from '@/lib/supabase/types'

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: gallery } = await supabase.from('galleries').select('*').eq('slug', slug).single<Gallery>()
  if (!gallery) notFound()

  if (gallery.status === 'draft') {
    const adminClient = await createClient()
    const { data: userData } = await adminClient.auth.getUser()
    if (!userData.user) notFound()
  }

  const cookieStore = await cookies()
  const unlocked = cookieStore.get(`gallery_access_${slug}`)?.value === 'unlocked'

  if (!unlocked) {
    return <UnlockForm slug={slug} />
  }

  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('gallery_id', gallery.id)
    .order('sort_order', { ascending: true })

  return <GalleryView title={gallery.title} photos={(photos ?? []) as Photo[]} />
}
```

- [ ] **Step 7: Commit**

```bash
git add app/gallery
git commit -m "Add public gallery page: draft gate, unlock form, unlocked grid+lightbox"
```

---

## Task 8: Download all (client-side zip)

**Files:**
- Create: `app/gallery/[slug]/DownloadAllButton.tsx`
- Test: `app/gallery/[slug]/DownloadAllButton.test.tsx`

- [ ] **Step 1: Install JSZip**

```bash
npm install jszip
```

- [ ] **Step 2: Write the failing test**

```typescript
// app/gallery/[slug]/DownloadAllButton.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DownloadAllButton } from './DownloadAllButton'

vi.mock('jszip', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      file: vi.fn(),
      generateAsync: vi.fn().mockResolvedValue(new Blob(['zip'])),
    })),
  }
})

describe('DownloadAllButton', () => {
  it('fetches every photo and triggers a zip download', async () => {
    global.fetch = vi.fn().mockResolvedValue({ blob: vi.fn().mockResolvedValue(new Blob(['photo'])) })
    const clickSpy = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') el.click = clickSpy
      return el
    })

    render(
      <DownloadAllButton
        title="Sunset Wedding"
        photos={[
          { id: '1', gallery_id: 'g1', r2_key: 'k1', url: 'https://r2/1.jpg', preview_url: 'https://r2/1p.jpg', width: null, height: null, filename: '1.jpg', sort_order: 0, created_at: '' },
        ]}
      />
    )

    await userEvent.setup().click(screen.getByRole('button', { name: 'Download all' }))

    expect(global.fetch).toHaveBeenCalledWith('https://r2/1.jpg')
    expect(clickSpy).toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test -- app/gallery/[slug]/DownloadAllButton.test.tsx`
Expected: FAIL — `./DownloadAllButton` does not exist yet.

- [ ] **Step 4: Write the component**

```typescript
// app/gallery/[slug]/DownloadAllButton.tsx
'use client'

import { useState } from 'react'
import JSZip from 'jszip'
import type { Photo } from '@/lib/supabase/types'

export function DownloadAllButton({ title, photos }: { title: string; photos: Photo[] }) {
  const [zipping, setZipping] = useState(false)

  async function handleClick() {
    setZipping(true)
    const zip = new JSZip()

    for (const photo of photos) {
      const response = await fetch(photo.url)
      const blob = await response.blob()
      zip.file(photo.filename ?? `${photo.id}.jpg`, blob)
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '-')}.zip`
    a.click()
    URL.revokeObjectURL(url)
    setZipping(false)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={zipping || photos.length === 0}
      className="rounded-xs border border-border px-4 py-2 text-sm text-ink disabled:opacity-40"
    >
      {zipping ? 'Zipping…' : 'Download all'}
    </button>
  )
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- app/gallery/[slug]/DownloadAllButton.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/gallery/[slug]/DownloadAllButton.tsx app/gallery/[slug]/DownloadAllButton.test.tsx package.json package-lock.json
git commit -m "Add client-side zip download-all for galleries"
```

---

## Task 9: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: All tests pass, including every test written across both plans.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: Clean build. Confirm `app/gallery/[slug]` and `app/admin/galleries/[id]` both appear as dynamic routes in the output.

- [ ] **Step 3: Manual smoke test**

With the dev server running: create a gallery in `/admin/galleries`, upload a couple of test photos, publish it, visit `/gallery/<slug>` in an incognito window, confirm the access-code form blocks entry, enter the correct code, confirm the grid/lightbox/download-all all work, then reload the page and confirm it stays unlocked (cookie persisted).

- [ ] **Step 4: Commit (if Step 3 surfaced any fixes)**

```bash
git add -A
git commit -m "Fix issues found during client-gallery smoke test"
```

---

## Self-Review Notes

- **Spec coverage:** every part of the design doc's "Client gallery access flow" section maps to a task: delivery (Task 5), access-code gate + cookie (Task 6), gallery view + per-photo download (Task 7), download-all (Task 8).
- **Gap caught during planning, not silently patched over:** Task 5 discovered the `client_email` column was missing from Task 1's schema (needed to actually send the email) and added it explicitly as its own step, including the fixture/type/form updates it cascades into, rather than quietly assuming it existed.
- **Type consistency:** `Gallery` and `Photo` (Task 2, amended in Task 5) are used with identical field names across the admin actions (Tasks 3–5), the unlock route (Task 6), and the public page/components (Tasks 7–8).
