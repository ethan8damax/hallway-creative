import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ServicesPage from './page'
import * as queries from '@/lib/supabase/queries'

vi.mock('@/lib/supabase/queries')

beforeEach(() => {
  vi.mocked(queries.getCategories).mockResolvedValue([])
})

describe('ServicesPage', () => {
  it('renders service titles and descriptions', async () => {
    vi.mocked(queries.getServices).mockResolvedValue([
      { id: '1', title: 'Wedding Photography', description: 'Full-day coverage.', category_id: null, sort_order: 0 },
    ])

    render(await ServicesPage())

    expect(screen.getByText('Wedding Photography')).toBeInTheDocument()
    expect(screen.getByText('Full-day coverage.')).toBeInTheDocument()
  })

  it('shows a fallback message when there are no services yet', async () => {
    vi.mocked(queries.getServices).mockResolvedValue([])

    render(await ServicesPage())

    expect(screen.getByText('New services coming soon — check back shortly.')).toBeInTheDocument()
  })
})
