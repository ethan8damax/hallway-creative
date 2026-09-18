import { describe, it, expect, vi } from 'vitest'
import { getCategories } from './queries'

vi.mock('./service', () => ({
  createServiceClient: vi.fn(),
}))

import { createServiceClient } from './service'

function mockQueryResult(data: unknown) {
  const order = vi.fn().mockResolvedValue({ data, error: null })
  const select = vi.fn().mockReturnValue({ order })
  const from = vi.fn().mockReturnValue({ select })
  return { client: { from }, from, select, order }
}

describe('getCategories', () => {
  it('queries the categories table ordered by sort_order ascending', async () => {
    const categories = [{ id: '1', title: 'Sports', slug: 'sports', description: null, sort_order: 0 }]
    const { client, from, select, order } = mockQueryResult(categories)
    vi.mocked(createServiceClient).mockReturnValue(client as never)

    const result = await getCategories()

    expect(result).toEqual(categories)
    expect(from).toHaveBeenCalledWith('categories')
    expect(select).toHaveBeenCalledWith('*')
    expect(order).toHaveBeenCalledWith('sort_order', { ascending: true })
  })
})
