import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UnlockForm } from './UnlockForm'

describe('UnlockForm', () => {
  it('shows an error on a rejected code and reloads on success', async () => {
    const reload = vi.fn()
    Object.defineProperty(window, 'location', { value: { reload }, writable: true })
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true })

    render(<UnlockForm slug="sunset-wedding" />)
    const user = userEvent.setup()
    const input = screen.getByLabelText('Access code')
    const button = screen.getByRole('button', { name: 'Unlock' })

    await user.type(input, 'wrong-code')
    await user.click(button)
    expect(await screen.findByText('Incorrect code. Try again.')).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'sunset-2026')
    await user.click(button)
    expect(reload).toHaveBeenCalled()
  })
})
