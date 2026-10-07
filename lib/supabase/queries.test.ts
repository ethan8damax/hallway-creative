import { describe, it, expect, vi } from 'vitest'
import { getCategories } from './queries'

vi.mock('./service', () => ({
  createServiceClient: vi.fn(),
}))

import { createServiceClient } from './service'

function mockQueryResult(data: unknown) {
  const limit = vi.fn().mockResolvedValue({ data, error: null })
  const chain = { order: vi.fn(), not: vi.fn(), limit }
  chain.order.mockReturnValue(chain)
  chain.not.mockReturnValue(chain)
  const order = chain.order
  const select = vi.fn().mockReturnValue(chain)
  const from = vi.fn().mockReturnValue({ select })
  return { client: { from }, from, select, order }
}

describe('getCategories', () => {
  it('queries the categories table ordered by sort_order ascending', async () => {
    const category = { id: '1', title: 'Sports', slug: 'sports', description: null, sort_order: 0 }
    const { client, from, select, order } = mockQueryResult([{ ...category, portfolio_media: [{ preview_url: 'https://x.r2.dev/p.jpg' }] }])
    vi.mocked(createServiceClient).mockReturnValue(client as never)

    const result = await getCategories()

    expect(result).toEqual([{ ...category, cover_url: 'https://x.r2.dev/p.jpg' }])
    expect(from).toHaveBeenCalledWith('categories')
    expect(select).toHaveBeenCalledWith('*, portfolio_media(preview_url)')
    expect(order).toHaveBeenCalledWith('sort_order', { ascending: true })
  })
})
