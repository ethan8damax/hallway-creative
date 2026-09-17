import { describe, it, expect } from 'vitest'
import { createClient } from './client'

describe('createClient', () => {
  it('returns a Supabase client without throwing', () => {
    expect(() => createClient()).not.toThrow()
  })
})
