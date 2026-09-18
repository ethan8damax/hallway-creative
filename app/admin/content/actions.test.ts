import { describe, it, expect, vi } from 'vitest'

const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ from: () => ({ update }) }),
}))
// ponytail: revalidatePath throws outside a real Next.js request/render
// context ("static generation store missing") — mock it so this test
// isolates the action's own logic instead of Next's internals.
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

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
