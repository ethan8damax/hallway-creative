import { describe, it, expect, vi, beforeEach } from 'vitest'

const insert = vi.fn()
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ from: () => ({ insert }) }),
}))
// ponytail: revalidatePath throws outside a real Next.js request/render
// context ("static generation store missing") — mock it so this test
// isolates the action's own logic instead of Next's internals.
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { createCategory, addMediaItem } from './actions'

beforeEach(() => {
  insert.mockReset()
})

describe('createCategory', () => {
  it('inserts a category with a slugified title', async () => {
    insert.mockResolvedValue({ error: null })

    await createCategory('Family Portraits')

    expect(insert).toHaveBeenCalledWith({ title: 'Family Portraits', slug: 'family-portraits', sort_order: 0 })
  })

  it('surfaces a friendly message on a duplicate slug', async () => {
    insert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key value' } })

    await expect(createCategory('Family Portraits')).rejects.toThrow('A category with that name already exists.')
  })
})

describe('addMediaItem', () => {
  it('returns the inserted row, including its database-assigned id', async () => {
    const insertedRow = { id: 'real-uuid', media_type: 'image', image_url: 'https://r2/a.jpg', preview_url: 'https://r2/a-preview.jpg', video_url: null, caption: null, sort_order: 0 }
    const single = vi.fn().mockResolvedValue({ data: insertedRow, error: null })
    const select = vi.fn().mockReturnValue({ single })
    insert.mockReturnValue({ select })

    const result = await addMediaItem('category-1', { media_type: 'image', image_url: 'https://r2/a.jpg', preview_url: 'https://r2/a-preview.jpg' })

    expect(result).toEqual(insertedRow)
  })
})
