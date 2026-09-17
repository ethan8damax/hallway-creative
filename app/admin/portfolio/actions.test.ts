import { describe, it, expect, vi } from 'vitest'

const insert = vi.fn().mockResolvedValue({ error: null })
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ from: () => ({ insert }) }),
}))
// ponytail: revalidatePath throws outside a real Next.js request/render
// context ("static generation store missing") — mock it so this test
// isolates the action's own logic instead of Next's internals.
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { createCategory } from './actions'

describe('createCategory', () => {
  it('inserts a category with a slugified title', async () => {
    await createCategory('Family Portraits')

    expect(insert).toHaveBeenCalledWith({ title: 'Family Portraits', slug: 'family-portraits', sort_order: 0 })
  })
})
