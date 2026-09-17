import { describe, it, expect, vi } from 'vitest'
import { getCategories } from './queries'

vi.mock('./service', () => ({
  createServiceClient: vi.fn(),
}))

import { createServiceClient } from './service'

function mockQueryResult(data: unknown) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data, error: null }),
      }),
    }),
  }
}

describe('getCategories', () => {
  it('returns categories ordered by sort_order', async () => {
    const categories = [{ id: '1', title: 'Sports', slug: 'sports', description: null, sort_order: 0 }]
    vi.mocked(createServiceClient).mockReturnValue(mockQueryResult(categories) as never)

    const result = await getCategories()

    expect(result).toEqual(categories)
  })
})
