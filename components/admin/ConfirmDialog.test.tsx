import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmProvider, useConfirm } from './ConfirmDialog'

beforeAll(() => {
  // jsdom has no <dialog> modal support
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
  }
})

let result: Promise<boolean>
function Trigger({ requireText }: { requireText?: string }) {
  const confirm = useConfirm()
  return (
    <button type="button" onClick={() => (result = confirm({ title: 'Delete “Smith Wedding”?', body: 'Gone for good.', confirmLabel: 'Delete gallery', requireText }))}>
      open
    </button>
  )
}

describe('ConfirmDialog', () => {
  it('resolves false on Cancel, so nothing is deleted', async () => {
    render(<ConfirmProvider><Trigger /></ConfirmProvider>)
    const user = userEvent.setup()
    await user.click(screen.getByText('open'))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await expect(result).resolves.toBe(false)
  })

  it('keeps Delete disabled until the exact name is typed', async () => {
    render(<ConfirmProvider><Trigger requireText="Smith Wedding" /></ConfirmProvider>)
    const user = userEvent.setup()
    await user.click(screen.getByText('open'))
    const del = screen.getByRole('button', { name: 'Delete gallery' })
    expect(del).toBeDisabled()
    await user.type(screen.getByRole('textbox'), 'Smith')
    expect(del).toBeDisabled()
    await user.type(screen.getByRole('textbox'), ' Wedding')
    expect(del).toBeEnabled()
    await act(() => user.click(del))
    await expect(result).resolves.toBe(true)
  })
})
