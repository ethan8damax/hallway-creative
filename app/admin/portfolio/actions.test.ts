import { describe, it, expect, vi, beforeEach } from 'vitest'

const insert = vi.fn()
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: () => ({
      insert,
      // nextSortOrder: pretend the highest existing sort_order is 4
      select: () => ({ order: () => ({ limit: () => ({ eq: async () => ({ data: [{ sort_order: 4 }] }), then: (r: (v: unknown) => void) => r({ data: [{ sort_order: 4 }] }) }) }) }),
    }),
  }),
}))
// ponytail: revalidatePath throws outside a real Next.js request/render
// context ("static generation store missing") — mock it so this test
// isolates the action's own logic instead of Next's internals.
vi.mock('@/lib/admin', () => ({ requireAdmin: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { addVideo, createCategory } from './actions'

const form = (fields: Record<string, string>) => {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

beforeEach(() => {
  insert.mockReset().mockResolvedValue({ error: null })
})

describe('createCategory', () => {
  it('inserts a slugified category at the end of the list', async () => {
    await createCategory(form({ title: 'Family Portraits', description: '' }))
    expect(insert).toHaveBeenCalledWith({ title: 'Family Portraits', slug: 'family-portraits', description: null, sort_order: 5 })
  })

  it('surfaces a friendly message on a duplicate slug', async () => {
    insert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key value' } })
    await expect(createCategory(form({ title: 'Sports' }))).rejects.toThrow('A category with that name already exists.')
  })
})

describe('addVideo', () => {
  it('rejects links that are not YouTube or Vimeo', async () => {
    await expect(addVideo('c1', form({ video_url: 'https://example.com/clip.mp4' }))).rejects.toThrow('Paste a YouTube or Vimeo link.')
    expect(insert).not.toHaveBeenCalled()
  })

  it('adds a valid video after the existing media', async () => {
    await addVideo('c1', form({ video_url: 'https://vimeo.com/12345', caption: 'Season recap' }))
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ media_type: 'video', video_url: 'https://vimeo.com/12345', sort_order: 5 }))
  })
})
