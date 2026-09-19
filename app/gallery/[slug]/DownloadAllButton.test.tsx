import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DownloadAllButton } from './DownloadAllButton'

// ponytail: an arrow function can't be used as a constructor, so `new JSZip()`
// throws "is not a constructor" against `mockImplementation(() => ...)`. A plain
// function returns its own object in place of `this` when called with `new`.
vi.mock('jszip', () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return {
        file: vi.fn(),
        generateAsync: vi.fn().mockResolvedValue(new Blob(['zip'])),
      }
    }),
  }
})

const photos = [
  { id: '1', gallery_id: 'g1', r2_key: 'k1', url: 'https://r2/1.jpg', preview_url: 'https://r2/1p.jpg', width: null, height: null, filename: '1.jpg', sort_order: 0, created_at: '' },
]

describe('DownloadAllButton', () => {
  it('fetches every photo and triggers a zip download', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, blob: vi.fn().mockResolvedValue(new Blob(['photo'])) })
    const clickSpy = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') el.click = clickSpy
      return el
    })

    render(<DownloadAllButton title="Sunset Wedding" photos={photos} />)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Download all' }))

    await waitFor(() => expect(clickSpy).toHaveBeenCalled())
    expect(global.fetch).toHaveBeenCalledWith('https://r2/1.jpg')
  })

  it('shows an error and resets the button if a fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false })

    render(<DownloadAllButton title="Sunset Wedding" photos={photos} />)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Download all' }))

    expect(await screen.findByText('Download failed. Try again.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download all' })).not.toBeDisabled()
  })

  it('disables the button when there are no photos', () => {
    render(<DownloadAllButton title="Sunset Wedding" photos={[]} />)

    expect(screen.getByRole('button', { name: 'Download all' })).toBeDisabled()
  })
})
