import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/accessCode', () => ({ hashAccessCode: vi.fn().mockResolvedValue('hashed') }))
const insert = vi.fn()
const update = vi.fn()
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: (table: string) =>
      table === 'client_activity'
        ? { insert: vi.fn().mockResolvedValue({ error: null }) }
        : { insert: (row: unknown) => ({ select: () => ({ single: () => insert(row) }) }), update },
  }),
}))
// ponytail: revalidatePath throws outside a real Next.js request/render
// context ("static generation store missing") — mock it so this test
// isolates the action's own logic instead of Next's internals.
vi.mock('@/lib/admin', () => ({ requireAdmin: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { createGallery, togglePublish } from './actions'

const form = (fields: Record<string, string>) => {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}
const valid = { title: 'Sunset Wedding', client_name: 'Jane & Sam', client_email: 'jane@example.com', event_date: '2026-10-01', access_code: 'sunset-2026' }

beforeEach(() => {
  insert.mockReset().mockResolvedValue({ data: { id: 'g1' }, error: null })
  update.mockReset()
})

describe('createGallery', () => {
  it('slugifies the title, hashes the code, links the client, and returns the new id', async () => {
    const id = await createGallery(form({ ...valid, client_id: 'c1', expires_on: '2027-01-01' }))

    expect(id).toBe('g1')
    expect(insert).toHaveBeenCalledWith({
      title: 'Sunset Wedding',
      client_name: 'Jane & Sam',
      client_email: 'jane@example.com',
      client_id: 'c1',
      slug: 'sunset-wedding',
      event_date: '2026-10-01',
      expires_on: '2027-01-01',
      access_code_hash: 'hashed',
      status: 'draft',
    })
  })

  it('rejects an empty access code before ever inserting', async () => {
    await expect(createGallery(form({ ...valid, access_code: '   ' }))).rejects.toThrow('Access code is required.')
    expect(insert).not.toHaveBeenCalled()
  })

  it('surfaces a friendly message on a duplicate slug', async () => {
    insert.mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key value' } })
    await expect(createGallery(form(valid))).rejects.toThrow('A gallery with that title already exists.')
  })
})

describe('togglePublish', () => {
  it('updates the gallery status', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    update.mockReturnValue({ eq })

    await togglePublish('g1', 'published')

    expect(update).toHaveBeenCalledWith({ status: 'published' })
    expect(eq).toHaveBeenCalledWith('id', 'g1')
  })
})
