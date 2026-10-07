import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CategoryPage from './page'
import * as queries from '@/lib/supabase/queries'

vi.mock('@/lib/supabase/queries')

describe('CategoryPage', () => {
  it('renders the category title, an empty state, and a link to the next category', async () => {
    vi.mocked(queries.getCategoryBySlug).mockResolvedValue({
      id: '1',
      title: 'Sports',
      slug: 'sports',
      description: null,
      sort_order: 0,
    })
    vi.mocked(queries.getMediaItemsForCategory).mockResolvedValue([])
    vi.mocked(queries.getCategories).mockResolvedValue([
      { id: '1', title: 'Sports', slug: 'sports', description: null, sort_order: 0 },
      { id: '2', title: 'Weddings', slug: 'weddings', description: null, sort_order: 1 },
    ])

    render(await CategoryPage({ params: Promise.resolve({ category: 'sports' }) }))

    expect(screen.getByRole('heading', { level: 1, name: 'Sports' })).toBeInTheDocument()
    expect(screen.getByText('New work for this category is on its way.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Weddings/ })).toHaveAttribute('href', '/portfolio/weddings')
  })

  it('throws (triggers notFound) for an unknown category', async () => {
    vi.mocked(queries.getCategoryBySlug).mockResolvedValue(null)

    await expect(CategoryPage({ params: Promise.resolve({ category: 'nope' }) })).rejects.toThrow()
  })
})
