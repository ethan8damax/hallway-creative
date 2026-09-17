import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from './Footer'

describe('Footer', () => {
  it('renders contact email and instagram link when settings are present', () => {
    render(
      <Footer
        settings={{
          id: '1',
          hero_headline: 'x',
          hero_subtext: null,
          contact_email: 'andrew@example.com',
          instagram_url: 'https://instagram.com/ahall.02',
        }}
      />
    )

    expect(screen.getByText('andrew@example.com')).toBeInTheDocument()
    expect(screen.getByText('Instagram')).toBeInTheDocument()
  })

  it('renders without links when settings are null', () => {
    render(<Footer settings={null} />)

    expect(screen.queryByText('Instagram')).not.toBeInTheDocument()
  })
})
