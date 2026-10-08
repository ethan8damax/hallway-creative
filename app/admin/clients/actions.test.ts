import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/admin', () => ({ requireAdmin: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

let currentStage = 'inquiry'
const update = vi.fn()
const activityInsert = vi.fn()
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: (table: string) =>
      table === 'client_activity'
        ? { insert: (row: unknown) => (activityInsert(row), Promise.resolve({ error: null })) }
        : {
            select: () => ({ eq: () => ({ single: async () => ({ data: { stage: currentStage }, error: null }) }) }),
            update: (row: unknown) => (update(row), { eq: async () => ({ error: null }) }),
          },
  }),
}))

import { moveClient } from './actions'

describe('moveClient', () => {
  beforeEach(() => {
    update.mockReset()
    activityInsert.mockReset()
  })

  it('updates the stage, clears New, and logs the move in plain words', async () => {
    currentStage = 'contract'
    await moveClient('c1', 'red_room')
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ stage: 'red_room', is_new: false }))
    expect(activityInsert).toHaveBeenCalledWith({ client_id: 'c1', kind: 'stage', body: 'Moved from Contract to Red Room' })
  })

  it('does nothing when the client is already in that stage', async () => {
    currentStage = 'event'
    await moveClient('c1', 'event')
    expect(update).not.toHaveBeenCalled()
    expect(activityInsert).not.toHaveBeenCalled()
  })

  it('rejects unknown stages', async () => {
    await expect(moveClient('c1', 'nonsense' as never)).rejects.toThrow('Unknown stage.')
  })
})
