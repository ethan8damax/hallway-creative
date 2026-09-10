import { describe, it, expect } from 'vitest'
import { validateContactForm } from './validateContactForm'

describe('validateContactForm', () => {
  it('returns no errors for valid data', () => {
    const errors = validateContactForm({ name: 'Jane', email: 'jane@example.com', message: 'Hi Andrew' })
    expect(errors).toEqual({})
  })

  it('flags a missing name', () => {
    const errors = validateContactForm({ name: '', email: 'jane@example.com', message: 'Hi' })
    expect(errors.name).toBeDefined()
  })

  it('flags an invalid email', () => {
    const errors = validateContactForm({ name: 'Jane', email: 'not-an-email', message: 'Hi' })
    expect(errors.email).toBeDefined()
  })

  it('flags a missing message', () => {
    const errors = validateContactForm({ name: 'Jane', email: 'jane@example.com', message: '' })
    expect(errors.message).toBeDefined()
  })
})
