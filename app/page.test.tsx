import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from './page'
import * as queries from '@/lib/sanity/queries'

vi.mock('@/lib/sanity/queries')

describe('HomePage', () => {
  it('renders the hero headline and category links', async () => {
    vi.mocked(queries.getSiteSettings).mockResolvedValue({ heroHeadline: 'Moments, captured', contactEmail: 'a@b.com' })
    vi.mocked(queries.getCategories).mockResolvedValue([
      { _id: '1', title: 'Sports', slug: 'sports', order: 0 },
    ])

    render(await HomePage())

    expect(screen.getByText('Moments, captured')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get in touch' })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: 'Sports' })).toHaveAttribute('href', '/portfolio/sports')
  })

  it('shows a fallback message when there are no categories yet', async () => {
    vi.mocked(queries.getSiteSettings).mockResolvedValue(null)
    vi.mocked(queries.getCategories).mockResolvedValue([])

    render(await HomePage())

    expect(screen.getByText('Portfolio categories coming soon.')).toBeInTheDocument()
  })
})
