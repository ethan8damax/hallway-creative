import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CategoryPage from './page'
import * as queries from '@/lib/supabase/queries'

vi.mock('@/lib/supabase/queries')

describe('CategoryPage', () => {
  it('renders the category title and media grid', async () => {
    vi.mocked(queries.getCategoryBySlug).mockResolvedValue({
      id: '1',
      title: 'Sports',
      slug: 'sports',
      description: null,
      sort_order: 0,
    })
    vi.mocked(queries.getMediaItemsForCategory).mockResolvedValue([])

    render(await CategoryPage({ params: Promise.resolve({ category: 'sports' }) }))

    expect(screen.getByText('Sports')).toBeInTheDocument()
    expect(screen.getAllByText('Photo coming soon')).toHaveLength(6)
  })

  it('throws (triggers notFound) for an unknown category', async () => {
    vi.mocked(queries.getCategoryBySlug).mockResolvedValue(null)

    await expect(CategoryPage({ params: Promise.resolve({ category: 'nope' }) })).rejects.toThrow()
  })
})
