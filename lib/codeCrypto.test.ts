import { describe, it, expect, beforeEach, vi } from 'vitest'
import { decryptCode, encryptCode } from './codeCrypto'

describe('access code encryption', () => {
  beforeEach(() => vi.stubEnv('GALLERY_SESSION_SECRET', 'test-secret'))

  it('round-trips a code, with a fresh ciphertext each time', () => {
    const a = encryptCode('lakeside-2026')
    expect(decryptCode(a)).toBe('lakeside-2026')
    expect(encryptCode('lakeside-2026')).not.toBe(a)
  })

  it('returns null for tampered data or a different secret', () => {
    const blob = encryptCode('lakeside-2026')
    const tampered = Buffer.from(blob, 'base64')
    tampered[tampered.length - 1] ^= 1
    expect(decryptCode(tampered.toString('base64'))).toBeNull()
    vi.stubEnv('GALLERY_SESSION_SECRET', 'other-secret')
    expect(decryptCode(blob)).toBeNull()
  })

  it('returns null when nothing is stored', () => {
    expect(decryptCode(null)).toBeNull()
  })
})
