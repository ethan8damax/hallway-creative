import { describe, it, expect } from 'vitest'
import { isExpired } from './galleryExpiry'

describe('isExpired', () => {
  it('is never expired without a date', () => {
    expect(isExpired(null)).toBe(false)
  })
  it('stays open through the expiry day and closes the day after', () => {
    expect(isExpired('2026-10-08', new Date('2026-10-08T23:59:00Z'))).toBe(false)
    expect(isExpired('2026-10-08', new Date('2026-10-09T00:00:01Z'))).toBe(true)
  })
})
