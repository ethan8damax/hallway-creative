import { describe, it, expect, vi } from 'vitest'

const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ from: () => ({ update }) }),
}))
// ponytail: revalidatePath throws outside a real Next.js request/render
// context ("static generation store missing") — mock it so this test
// isolates the action's own logic instead of Next's internals.
vi.mock('@/lib/admin', () => ({ requireAdmin: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { updateSiteSettings } from './actions'

const form = (fields: Record<string, string>) => {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

describe('updateSiteSettings', () => {
  it('saves trimmed values and stores blanks as null', async () => {
    await updateSiteSettings('row-1', form({ hero_headline: ' New headline ', hero_subtext: '', contact_email: 'a@b.com', instagram_url: '' }))
    expect(update).toHaveBeenCalledWith({ hero_headline: 'New headline', hero_subtext: null, contact_email: 'a@b.com', instagram_url: null })
  })

  it('rejects an Instagram value that is not a link', async () => {
    await expect(updateSiteSettings('row-1', form({ instagram_url: '@hallway' }))).rejects.toThrow('should start with https://')
  })
})
