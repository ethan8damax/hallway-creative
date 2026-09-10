import { describe, it, expect, vi, type Mock } from 'vitest'
import { sanityClient } from './client'
import { getCategoryBySlug, getMediaItemsForCategory } from './queries'

vi.mock('./client', () => ({
  sanityClient: { fetch: vi.fn() },
}))

// ponytail: sanityClient.fetch is a heavily overloaded generic signature; vi.mocked()
// resolves to the wrong overload's return type here. Cast to Mock to sidestep it.
const fetchMock = sanityClient.fetch as unknown as Mock

describe('getCategoryBySlug', () => {
  it('passes the slug as a query parameter', async () => {
    fetchMock.mockResolvedValue({ _id: '1', title: 'Sports', slug: 'sports', order: 0 })

    const result = await getCategoryBySlug('sports')

    expect(sanityClient.fetch).toHaveBeenCalledWith(expect.stringContaining('slug.current == $slug'), { slug: 'sports' })
    expect(result?.title).toBe('Sports')
  })
})

describe('getMediaItemsForCategory', () => {
  it('passes the category id as a query parameter', async () => {
    fetchMock.mockResolvedValue([])

    const result = await getMediaItemsForCategory('cat-1')

    expect(sanityClient.fetch).toHaveBeenCalledWith(expect.stringContaining('category._ref == $categoryId'), { categoryId: 'cat-1' })
    expect(result).toEqual([])
  })
})
