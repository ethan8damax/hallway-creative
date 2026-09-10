import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AboutPage from './page'
import * as queries from '@/lib/sanity/queries'

vi.mock('@/lib/sanity/queries')

describe('AboutPage', () => {
  it('renders the bio when present', async () => {
    vi.mocked(queries.getAbout).mockResolvedValue({ bio: 'Andrew has been shooting for 10 years.' })

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
      bio: 'Andrew has been shooting for 10 years.',
      portrait: { asset: { _ref: 'image-abcdef1234567890abcdef1234567890abcdef12-600x750-jpg', _type: 'reference' } },
    })

    render(await AboutPage())

    expect(screen.getByRole('img', { name: 'Andrew Hall' })).toBeInTheDocument()
  })

  it('renders without an image when the portrait ref is malformed', async () => {
    vi.mocked(queries.getAbout).mockResolvedValue({ bio: 'Andrew has been shooting for 10 years.', portrait: {} })

    render(await AboutPage())

    expect(screen.queryByRole('img', { name: 'Andrew Hall' })).not.toBeInTheDocument()
  })
})
