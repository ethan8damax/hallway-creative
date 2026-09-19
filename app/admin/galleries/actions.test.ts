import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/accessCode', () => ({ hashAccessCode: vi.fn().mockResolvedValue('hashed') }))
const insert = vi.fn()
const update = vi.fn()
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ from: () => ({ insert, update }) }),
}))
// ponytail: revalidatePath throws outside a real Next.js request/render
// context ("static generation store missing") — mock it so this test
// isolates the action's own logic instead of Next's internals.
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { createGallery, addPhoto, togglePublish } from './actions'

beforeEach(() => {
  insert.mockReset()
  insert.mockResolvedValue({ error: null })
  update.mockReset()
})

describe('createGallery', () => {
  it('slugifies the title and hashes the access code before inserting', async () => {
    await createGallery({ title: 'Sunset Wedding', clientName: 'Jane & Sam', clientEmail: 'jane@example.com', eventDate: '2026-10-01', accessCode: 'sunset-2026' })

    expect(insert).toHaveBeenCalledWith({
      title: 'Sunset Wedding',
      client_name: 'Jane & Sam',
      client_email: 'jane@example.com',
      slug: 'sunset-wedding',
      event_date: '2026-10-01',
      access_code_hash: 'hashed',
      status: 'draft',
    })
  })

  it('rejects an empty access code before ever hashing or inserting', async () => {
    await expect(
      createGallery({ title: 'Sunset Wedding', clientName: 'Jane & Sam', clientEmail: 'jane@example.com', eventDate: '2026-10-01', accessCode: '   ' })
    ).rejects.toThrow('Access code is required.')

    expect(insert).not.toHaveBeenCalled()
  })

  it('surfaces a friendly message on a duplicate slug', async () => {
    insert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key value' } })

    await expect(
      createGallery({ title: 'Sunset Wedding', clientName: 'Jane & Sam', clientEmail: 'jane@example.com', eventDate: '2026-10-01', accessCode: 'sunset-2026' })
    ).rejects.toThrow('A gallery with that title already exists.')
  })
})

describe('addPhoto', () => {
  it('inserts a photo row and returns it, including its database-assigned id', async () => {
    const insertedRow = {
      id: 'real-uuid',
      gallery_id: 'gallery-1',
      r2_key: 'galleries/g1/a.jpg',
      url: 'https://r2/a.jpg',
      preview_url: 'https://r2/a-preview.jpg',
      width: 1200,
      height: 1600,
      filename: 'a.jpg',
      sort_order: 0,
    }
    const single = vi.fn().mockResolvedValue({ data: insertedRow, error: null })
    const select = vi.fn().mockReturnValue({ single })
    insert.mockReturnValue({ select })

    const result = await addPhoto('gallery-1', {
      r2_key: 'galleries/g1/a.jpg',
      url: 'https://r2/a.jpg',
      preview_url: 'https://r2/a-preview.jpg',
      width: 1200,
      height: 1600,
      filename: 'a.jpg',
    })

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
    expect(result).toEqual(insertedRow)
  })
})

describe('togglePublish', () => {
  it('updates the gallery status', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    update.mockReturnValue({ eq })

    await togglePublish('gallery-1', 'published')

    expect(update).toHaveBeenCalledWith({ status: 'published' })
    expect(eq).toHaveBeenCalledWith('id', 'gallery-1')
  })
})
