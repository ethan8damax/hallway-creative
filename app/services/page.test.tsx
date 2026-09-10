import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ServicesPage from './page'
import * as queries from '@/lib/sanity/queries'

vi.mock('@/lib/sanity/queries')

describe('ServicesPage', () => {
  it('renders service titles and descriptions', async () => {
    vi.mocked(queries.getServices).mockResolvedValue([
      { _id: '1', title: 'Wedding Photography', description: 'Full-day coverage.', order: 0 },
    ])

    render(await ServicesPage())

    expect(screen.getByText('Wedding Photography')).toBeInTheDocument()
    expect(screen.getByText('Full-day coverage.')).toBeInTheDocument()
  })

  it('shows a fallback message when there are no services yet', async () => {
    vi.mocked(queries.getServices).mockResolvedValue([])

    render(await ServicesPage())

    expect(screen.getByText('Services coming soon.')).toBeInTheDocument()
  })
})
