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

  it('rejects a non-image content type', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    } as never)

    const response = await POST(requestWith({ filename: 'a.html', contentType: 'text/html', prefix: 'portfolio/sports' }))

    expect(response.status).toBe(400)
  })

  it('percent-encodes special characters in the returned publicUrl', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    } as never)

    const response = await POST(
      requestWith({ filename: 'IMG 2024 (final).jpg', contentType: 'image/jpeg', prefix: 'portfolio/sports' })
    )
    const body = await response.json()

    // Spaces are the character most likely to actually break a URL when
    // rendered as an <img src> or stored raw; parens are valid unencoded
    // per RFC 3986 and encodeURIComponent leaves them as-is by design.
    expect(body.publicUrl).not.toContain(' ')
    expect(body.publicUrl).toContain('%20')
    expect(body.publicUrl).toContain('portfolio/sports/')
  })
})
