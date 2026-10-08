import bcrypt from 'bcryptjs'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }))

const send = vi.fn()
// ponytail: an arrow function can't be used as a constructor, so `new Resend(...)`
// throws "is not a constructor" against `mockImplementation(() => ...)`. A plain
// function returns its own object in place of `this` when called with `new`,
// which is what makes this work as a drop-in class replacement.
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send } }
  }),
}))

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { POST } from './route'

function requestParams() {
  return { params: Promise.resolve({ id: 'gallery-1' }) }
}

// ponytail: real bcrypt hash of 'sunset-2026' (cost 4 keeps the test fast)
const galleryRow = {
  title: 'Sunset Wedding',
  client_name: 'Jane',
  slug: 'sunset-wedding',
  client_email: 'jane@example.com',
  access_code_hash: bcrypt.hashSync('sunset-2026', 4),
  client_id: null,
}
const withCode = (code: string) => new Request('http://localhost', { method: 'POST', body: JSON.stringify({ code }) })

function mockAuthenticated() {
  vi.mocked(createClient).mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'hallway.ah@gmail.com' } } }) } } as never)
}

function mockGalleryLookup(result: { data: unknown; error: unknown }, update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })) {
  vi.mocked(createServiceClient).mockReturnValue({
    from: () => ({
      select: () => ({ eq: () => ({ single: vi.fn().mockResolvedValue(result) }) }),
      update,
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  } as never)
  return update
}

describe('POST /api/admin/galleries/[id]/send', () => {
  it('rejects an unauthenticated request', async () => {
    vi.mocked(createClient).mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } } as never)

    const response = await POST(new Request('http://localhost'), requestParams())

    expect(response.status).toBe(401)
  })

  it('returns 404 when the gallery does not exist', async () => {
    mockAuthenticated()
    mockGalleryLookup({ data: null, error: null })

    const response = await POST(new Request('http://localhost'), requestParams())

    expect(response.status).toBe(404)
  })

  it('refuses to send when the access code does not match, so a typo never reaches the client', async () => {
    mockAuthenticated()
    const update = mockGalleryLookup({ data: galleryRow, error: null })
    send.mockReset()

    const response = await POST(withCode('sunset-2025'), requestParams())

    expect(response.status).toBe(400)
    expect(send).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })

  it('emails the client the link and code, records sent_at, and returns 200', async () => {
    mockAuthenticated()
    const update = mockGalleryLookup({ data: galleryRow, error: null })
    send.mockResolvedValue({ error: null })

    const response = await POST(withCode('sunset-2026'), requestParams())

    expect(response.status).toBe(200)
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com',
        subject: expect.stringContaining('Sunset Wedding'),
        text: expect.stringContaining('Access code: sunset-2026'),
      })
    )
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ sent_at: expect.any(String) }))
  })

  it('returns 502 and does not record sent_at when Resend fails', async () => {
    mockAuthenticated()
    const update = mockGalleryLookup({ data: galleryRow, error: null })
    send.mockResolvedValue({ error: { message: 'domain not verified' } })

    const response = await POST(withCode('sunset-2026'), requestParams())

    expect(response.status).toBe(502)
    expect(update).not.toHaveBeenCalled()
  })
})
