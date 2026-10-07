import { describe, it, expect, vi, beforeEach } from 'vitest'

const sendMock = vi.fn()
vi.mock('resend', () => ({
  // ponytail: mockImplementation needs a constructible function, not an arrow fn
  // (arrow functions throw "is not a constructor" under `new`).
  Resend: vi.fn().mockImplementation(function Resend() {
    return { emails: { send: sendMock } }
  }),
}))

const clientInsert = vi.fn()
const activityInsert = vi.fn().mockResolvedValue({ error: null })
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: (table: string) =>
      table === 'clients'
        ? { insert: (row: unknown) => ({ select: () => ({ single: () => clientInsert(row) }) }) }
        : { insert: activityInsert },
  }),
}))

describe('POST /api/contact', () => {
  beforeEach(() => {
    sendMock.mockReset()
    clientInsert.mockReset().mockResolvedValue({ data: { id: 'c1' }, error: null })
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

  it('saves the inquiry as a new client in the pipeline', async () => {
    sendMock.mockResolvedValue({ data: { id: '1' }, error: null })
    const { POST } = await import('./route')

    await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name: ' Jane ', email: 'jane@example.com', message: 'Hi', eventDate: '2027-06-01', phone: '' }),
      })
    )

    expect(clientInsert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Jane', event_date: '2027-06-01', phone: null, inquiry_message: 'Hi' })
    )
    expect(activityInsert).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'c1', kind: 'inquiry' }))
  })

  it('still succeeds when the email fails but the inquiry was saved', async () => {
    sendMock.mockRejectedValue(new Error('send failed'))
    const { POST } = await import('./route')

    const res = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name: 'Jane', email: 'jane@example.com', message: 'Hi' }),
      })
    )

    expect(res.status).toBe(200)
  })

  it('returns 502 when both the save and the email send fail', async () => {
    clientInsert.mockResolvedValue({ data: null, error: new Error('db down') })
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

  it('treats a resolved Resend error as a failed send (Resend does not throw on API errors)', async () => {
    clientInsert.mockResolvedValue({ data: null, error: new Error('db down') })
    sendMock.mockResolvedValue({ data: null, error: { message: 'domain not verified', name: 'validation_error', statusCode: 403 } })
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
