import { describe, it, expect, vi } from 'vitest'

const getUser = vi.fn()
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser } }) }))

import { isAdminEmail, requireAdmin } from './admin'

describe('admin allowlist', () => {
  it('accepts listed emails case-insensitively and rejects others', () => {
    expect(isAdminEmail('Hallway.AH@gmail.com')).toBe(true)
    expect(isAdminEmail('stranger@example.com')).toBe(false)
    expect(isAdminEmail(undefined)).toBe(false)
  })

  it('requireAdmin throws for a signed-in non-admin and for no user', async () => {
    getUser.mockResolvedValueOnce({ data: { user: { email: 'stranger@example.com' } } })
    await expect(requireAdmin()).rejects.toThrow('unauthorized')
    getUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(requireAdmin()).rejects.toThrow('unauthorized')
    getUser.mockResolvedValueOnce({ data: { user: { email: 'ethandouglasmaxey@gmail.com' } } })
    await expect(requireAdmin()).resolves.toBeUndefined()
  })
})
