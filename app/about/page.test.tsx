import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AboutPage from './page'
import * as queries from '@/lib/supabase/queries'

vi.mock('@/lib/supabase/queries')

describe('AboutPage', () => {
  it('renders the bio when present', async () => {
    vi.mocked(queries.getAbout).mockResolvedValue({
      id: '1',
      bio: 'Andrew has been shooting for 10 years.',
      portrait_url: null,
    })

    render(await AboutPage())

    expect(screen.getByText('Andrew has been shooting for 10 years.')).toBeInTheDocument()
  })

  it('shows a fallback message when there is no bio yet', async () => {
    vi.mocked(queries.getAbout).mockResolvedValue(null)

    render(await AboutPage())

    expect(screen.getByText("Andrew's story is coming soon — check back shortly.")).toBeInTheDocument()
  })

  it('renders the portrait image when present', async () => {
    vi.mocked(queries.getAbout).mockResolvedValue({
      id: '1',
      bio: 'Andrew has been shooting for 10 years.',
      portrait_url: 'https://example.com/portrait.jpg',
    })

    render(await AboutPage())

    expect(screen.getByRole('img', { name: 'Andrew Hall' })).toBeInTheDocument()
  })

  it('renders without an image when there is no portrait url', async () => {
    vi.mocked(queries.getAbout).mockResolvedValue({
      id: '1',
      bio: 'Andrew has been shooting for 10 years.',
      portrait_url: null,
    })

    render(await AboutPage())

    expect(screen.queryByRole('img', { name: 'Andrew Hall' })).not.toBeInTheDocument()
  })
})
