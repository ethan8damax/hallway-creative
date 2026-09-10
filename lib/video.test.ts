import { describe, it, expect } from 'vitest'
import { getVideoEmbedUrl } from './video'

describe('getVideoEmbedUrl', () => {
  it('converts a youtube.com/watch URL', () => {
    expect(getVideoEmbedUrl('https://www.youtube.com/watch?v=abc123')).toBe('https://www.youtube.com/embed/abc123')
  })

  it('converts a youtu.be short URL', () => {
    expect(getVideoEmbedUrl('https://youtu.be/abc123')).toBe('https://www.youtube.com/embed/abc123')
  })

  it('converts a vimeo.com URL', () => {
    expect(getVideoEmbedUrl('https://vimeo.com/123456789')).toBe('https://player.vimeo.com/video/123456789')
  })

  it('returns null for an unrecognized host', () => {
    expect(getVideoEmbedUrl('https://example.com/video')).toBeNull()
  })

  it('returns null for an invalid URL', () => {
    expect(getVideoEmbedUrl('not a url')).toBeNull()
  })

  it('returns null for a lookalike host that merely contains youtube.com', () => {
    expect(getVideoEmbedUrl('https://notyoutube.com/watch?v=abc123')).toBeNull()
  })
})
