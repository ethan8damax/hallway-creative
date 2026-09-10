import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MediaGrid } from './MediaGrid'

describe('MediaGrid', () => {
  it('renders 6 placeholder tiles when there are no items', () => {
    render(<MediaGrid items={[]} />)

    expect(screen.getAllByText('Photo coming soon')).toHaveLength(6)
  })

  it('renders no placeholder tiles when items are present', () => {
    render(<MediaGrid items={[{ _id: '1', mediaType: 'image', image: {}, order: 0 }]} />)

    expect(screen.queryByText('Photo coming soon')).not.toBeInTheDocument()
  })
})
