import { describe, it, expect } from 'vitest'
import { vi } from 'vitest'

vi.mock('@/lib/accessCode', () => ({ verifyAccessCode: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }))

import { verifyAccessCode } from '@/lib/accessCode'
import { createServiceClient } from '@/lib/supabase/service'
import { signGalleryToken } from '@/lib/gallerySession'
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

  it('sets a signed, non-forgeable cookie on a correct code', async () => {
    vi.mocked(createServiceClient).mockReturnValue({
      from: () => ({ select: () => ({ eq: () => ({ single: vi.fn().mockResolvedValue({ data: { id: 'g1', access_code_hash: 'hash' }, error: null }) }) }) }),
    } as never)
    vi.mocked(verifyAccessCode).mockResolvedValue(true)

    const response = await POST(requestWith('sunset-2026'), paramsFor('sunset-wedding'))
    const setCookie = response.headers.get('set-cookie')

    expect(response.status).toBe(200)
    expect(setCookie).toContain(`gallery_access_sunset-wedding=${signGalleryToken('sunset-wedding', 'hash')}`)
    // ponytail: guards against regressing back to the old forgeable literal
    // 'unlocked' string — anyone could set that value on a raw request.
    expect(setCookie).not.toContain('gallery_access_sunset-wedding=unlocked')
  })
})
