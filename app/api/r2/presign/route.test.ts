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
