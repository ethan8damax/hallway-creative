import { describe, it, expect, vi, beforeEach } from 'vitest'

const sendMock = vi.fn()
vi.mock('resend', () => ({
  // ponytail: mockImplementation needs a constructible function, not an arrow fn
  // (arrow functions throw "is not a constructor" under `new`).
  Resend: vi.fn().mockImplementation(function Resend() {
    return { emails: { send: sendMock } }
  }),
}))

describe('POST /api/contact', () => {
  beforeEach(() => {
    sendMock.mockReset()
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('CONTACT_TO_EMAIL', 'andrew@example.com')
  })

  it('sends an email and returns ok for valid data', async () => {
    sendMock.mockResolvedValue({ data: { id: '1' }, error: null })
    const { POST } = await import('./route')

    const res = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name: 'Jane', email: 'jane@example.com', message: 'Hi', eventType: 'Wedding' }),
      })
    )

    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)
  })

  it('returns 400 with field errors for invalid data', async () => {
    const { POST } = await import('./route')

    const res = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name: '', email: 'not-an-email', message: '' }),
      })
    )

    expect(res.status).toBe(400)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('silently accepts and does not send when the honeypot field is filled', async () => {
    const { POST } = await import('./route')

    const res = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name: 'Bot', email: 'bot@example.com', message: 'spam', company: 'filled' }),
      })
    )

    expect(res.status).toBe(200)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('returns 502 when the email send fails', async () => {
    sendMock.mockRejectedValue(new Error('send failed'))
    const { POST } = await import('./route')

    const res = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name: 'Jane', email: 'jane@example.com', message: 'Hi' }),
      })
    )

    expect(res.status).toBe(502)
  })
})
