import { describe, it, expect } from 'vitest'
import { hashAccessCode, verifyAccessCode } from './accessCode'

describe('accessCode', () => {
  it('verifies a matching code and rejects a mismatched one', async () => {
    const hash = await hashAccessCode('sunset-2026')

    expect(await verifyAccessCode('sunset-2026', hash)).toBe(true)
    expect(await verifyAccessCode('wrong-code', hash)).toBe(false)
  })
})
