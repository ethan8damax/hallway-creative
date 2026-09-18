import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'

const signInWithOtp = vi.fn().mockResolvedValue({ error: null })
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithOtp } }),
}))

describe('LoginForm', () => {
  it('sends a magic link and shows a confirmation message', async () => {
    render(<LoginForm />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Email'), 'andrew@example.com')
    await user.click(screen.getByRole('button', { name: 'Send magic link' }))

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'andrew@example.com',
      options: { emailRedirectTo: expect.stringContaining('/admin/auth/callback') },
    })
    expect(await screen.findByText('Check your email for a login link.')).toBeInTheDocument()
  })
})
