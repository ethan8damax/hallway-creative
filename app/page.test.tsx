import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from './page'
import * as queries from '@/lib/supabase/queries'

vi.mock('@/lib/supabase/queries')
vi.mock('next/server', () => ({ connection: vi.fn() }))

beforeEach(() => {
  vi.mocked(queries.getAbout).mockResolvedValue(null)
  vi.mocked(queries.getRandomHeroPhoto).mockResolvedValue({
    url: 'https://x.r2.dev/hero.jpg',
    caption: 'Game winner',
    categoryTitle: 'Sports',
    categorySlug: 'sports',
  })
})

describe('HomePage', () => {
  it('renders the hero headline and category links', async () => {
    vi.mocked(queries.getSiteSettings).mockResolvedValue({
      id: '1',
      hero_headline: 'Moments, captured',
      hero_subtext: null,
      contact_email: 'a@b.com',
      instagram_url: null,
    })
    vi.mocked(queries.getCategories).mockResolvedValue([
      { id: '1', title: 'Sports', slug: 'sports', description: null, sort_order: 0 },
    ])

    render(await HomePage())

    expect(screen.getByText('Moments, captured')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get in touch' })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: /^Sports/ })).toHaveAttribute('href', '/portfolio/sports')
    // the hero photo credits the category it came from
    expect(screen.getByRole('link', { name: /From the sports portfolio/ })).toHaveAttribute('href', '/portfolio/sports')
  })

  it('shows a fallback message when there are no categories yet', async () => {
    vi.mocked(queries.getSiteSettings).mockResolvedValue(null)
    vi.mocked(queries.getCategories).mockResolvedValue([])

    render(await HomePage())

    expect(screen.getByText('Portfolio categories coming soon.')).toBeInTheDocument()
  })
})
