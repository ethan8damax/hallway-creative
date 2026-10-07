import { describe, it, expect } from 'vitest'
import { screeningRows } from './screeningRows'

const L = { width: 3, height: 2 }
const P = { width: 2, height: 3 }
const shape = (rows: { width: number | null; height: number | null }[][]) =>
  rows.map((r) => r.map((x) => (x === L ? 'L' : x === P ? 'P' : '?')).join('')).join(' ')

describe('screeningRows', () => {
  it('alternates a full-width landscape with paired rows', () => {
    expect(shape(screeningRows([L, L, L, L, L]))).toBe('L LL L L')
  })

  it('groups portraits in threes', () => {
    expect(shape(screeningRows([P, P, P, P, P, P]))).toBe('PPP PPP')
  })

  it('keeps every item exactly once, in order', () => {
    const items = [L, P, L, P, P, L, L, P, L]
    expect(screeningRows(items).flat()).toEqual(items)
  })

  it('treats unknown dimensions as landscape', () => {
    const unknown = { width: null, height: null }
    expect(screeningRows([unknown])).toEqual([[unknown]])
  })
})
