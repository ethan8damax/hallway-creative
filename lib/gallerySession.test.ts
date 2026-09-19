import { describe, it, expect } from 'vitest'
import { signGalleryToken, verifyGalleryToken } from './gallerySession'

describe('gallerySession', () => {
  it('verifies a token signed for the same slug and access code hash', () => {
    const token = signGalleryToken('sunset-wedding', 'hash-1')
    expect(verifyGalleryToken('sunset-wedding', 'hash-1', token)).toBe(true)
  })

  it('rejects a token signed for a different slug', () => {
    const token = signGalleryToken('sunset-wedding', 'hash-1')
    expect(verifyGalleryToken('other-gallery', 'hash-1', token)).toBe(false)
  })

  it('rejects a stale token after the access code (and its hash) is rotated', () => {
    const token = signGalleryToken('sunset-wedding', 'hash-1')
    expect(verifyGalleryToken('sunset-wedding', 'hash-2', token)).toBe(false)
  })

  it('rejects a forged/guessed value like the old literal "unlocked" string', () => {
    expect(verifyGalleryToken('sunset-wedding', 'hash-1', 'unlocked')).toBe(false)
  })

  it('rejects a missing token', () => {
    expect(verifyGalleryToken('sunset-wedding', 'hash-1', undefined)).toBe(false)
    expect(verifyGalleryToken('sunset-wedding', 'hash-1', null)).toBe(false)
  })

  it('produces a deterministic token for the same slug and hash', () => {
    expect(signGalleryToken('sunset-wedding', 'hash-1')).toBe(signGalleryToken('sunset-wedding', 'hash-1'))
  })
})
