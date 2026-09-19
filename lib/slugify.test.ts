import { describe, it, expect } from 'vitest'
import { slugify, isDuplicateSlugError } from './slugify'

describe('slugify', () => {
  it('lowercases, trims, and collapses non-alphanumeric runs to single hyphens', () => {
    expect(slugify('Family Portraits!')).toBe('family-portraits')
    expect(slugify('Family Portraits?')).toBe('family-portraits')
    expect(slugify('  Sunset   Wedding  ')).toBe('sunset-wedding')
  })
})

describe('isDuplicateSlugError', () => {
  it('recognizes a Postgres unique-violation code and rejects everything else', () => {
    expect(isDuplicateSlugError({ code: '23505' })).toBe(true)
    expect(isDuplicateSlugError({ code: '23502' })).toBe(false)
    expect(isDuplicateSlugError(null)).toBe(false)
  })
})
