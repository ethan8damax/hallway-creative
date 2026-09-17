import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from './page'
import * as queries from '@/lib/supabase/queries'

vi.mock('@/lib/supabase/queries')

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
    expect(screen.getByRole('link', { name: /Sports/ })).toHaveAttribute('href', '/portfolio/sports')
  })

  it('shows a fallback message when there are no categories yet', async () => {
    vi.mocked(queries.getSiteSettings).mockResolvedValue(null)
    vi.mocked(queries.getCategories).mockResolvedValue([])

    render(await HomePage())

    expect(screen.getByText('Portfolio categories coming soon.')).toBeInTheDocument()
  })
})
