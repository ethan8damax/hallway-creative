import { describe, it, expect } from 'vitest'
import { signGalleryToken, verifyGalleryToken } from './gallerySession'

describe('gallerySession', () => {
  it('verifies a token signed for the same slug', () => {
    const token = signGalleryToken('sunset-wedding')
    expect(verifyGalleryToken('sunset-wedding', token)).toBe(true)
  })

  it('rejects a token signed for a different slug', () => {
    const token = signGalleryToken('sunset-wedding')
    expect(verifyGalleryToken('other-gallery', token)).toBe(false)
  })

  it('rejects a forged/guessed value like the old literal "unlocked" string', () => {
    expect(verifyGalleryToken('sunset-wedding', 'unlocked')).toBe(false)
  })

  it('rejects a missing token', () => {
    expect(verifyGalleryToken('sunset-wedding', undefined)).toBe(false)
    expect(verifyGalleryToken('sunset-wedding', null)).toBe(false)
  })

  it('produces a deterministic token for the same slug', () => {
    expect(signGalleryToken('sunset-wedding')).toBe(signGalleryToken('sunset-wedding'))
  })
})
