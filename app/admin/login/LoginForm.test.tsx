import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'

const signInWithPassword = vi.fn()
const push = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithPassword } }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }))

async function submit() {
  render(<LoginForm />)
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), 'andrew@example.com')
  await user.type(screen.getByLabelText('Password'), 'secret')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('LoginForm', () => {
  it('signs in with email and password and goes to /admin', async () => {
    signInWithPassword.mockResolvedValueOnce({ error: null })
    await submit()
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'andrew@example.com', password: 'secret' })
    expect(push).toHaveBeenCalledWith('/admin')
  })

  it('shows an error on bad credentials', async () => {
    signInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } })
    await submit()
    expect(await screen.findByText('Wrong email or password.')).toBeInTheDocument()
  })
})
