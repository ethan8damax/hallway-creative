import { describe, it, expect } from 'vitest'
import { keyFromPublicUrl } from './r2'

const base = 'https://pub-abc.r2.dev'

describe('keyFromPublicUrl', () => {
  it('recovers the key, decoding each path segment', () => {
    expect(keyFromPublicUrl(`${base}/galleries/sunset/1700-preview-IMG%201.jpg`, base)).toBe('galleries/sunset/1700-preview-IMG 1.jpg')
  })
  it('refuses URLs that are not on our bucket', () => {
    expect(keyFromPublicUrl('https://evil.example.com/galleries/x.jpg', base)).toBeNull()
    expect(keyFromPublicUrl(`${base}.evil.com/x.jpg`, base)).toBeNull()
    expect(keyFromPublicUrl(null, base)).toBeNull()
  })
})
