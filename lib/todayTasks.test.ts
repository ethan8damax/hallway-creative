import { describe, it, expect } from 'vitest'
import { buildToday, type TodayGallery } from './todayTasks'
import type { Client } from './supabase/types'

const now = new Date('2026-10-08T12:00:00Z')
const client = (over: Partial<Client>): Client => ({
  id: 'c', name: 'Pat', email: 'p@x.com', phone: null, event_type: null, event_date: null, event_location: null,
  stage: 'conversation', is_new: false, inquiry_message: null, contract_url: null, contract_signed_on: null,
  created_at: '2026-10-01T00:00:00Z', stage_changed_at: '2026-10-01T00:00:00Z', ...over,
})
const gallery = (over: Partial<TodayGallery>): TodayGallery => ({
  id: 'g', title: 'Wedding', client_name: 'Pat', status: 'published', sent_at: null, first_viewed_at: null, expires_on: null, ...over,
})

describe('buildToday', () => {
  it('surfaces new inquiries, unsent galleries, unopened sends after 3 days, and past events', () => {
    const { tasks } = buildToday(
      [client({ id: 'a', is_new: true }), client({ id: 'b', stage: 'event', event_date: '2026-10-01' })],
      [
        gallery({ id: 'unsent' }),
        gallery({ id: 'stale', sent_at: '2026-10-01T00:00:00Z' }),
        gallery({ id: 'fresh', sent_at: '2026-10-07T00:00:00Z' }),
        gallery({ id: 'opened', sent_at: '2026-10-01T00:00:00Z', first_viewed_at: '2026-10-02T00:00:00Z' }),
      ],
      now
    )
    expect(tasks.map((t) => t.key)).toEqual(['new-a', 'shot-b', 'send-unsent', 'nudge-stale'])
  })

  it('warns about galleries closing within a week, and lists closed ones for cleanup', () => {
    const { tasks } = buildToday([], [gallery({ id: 'soon', sent_at: '2026-10-07T00:00:00Z', expires_on: '2026-10-12' }), gallery({ id: 'gone', expires_on: '2026-10-01' })], now)
    expect(tasks.map((t) => t.key)).toEqual(['exp-soon', 'closed-gone'])
  })

  it('lists upcoming events in date order within six weeks', () => {
    const { upcoming } = buildToday(
      [
        client({ id: 'later', stage: 'event', event_date: '2026-11-10' }),
        client({ id: 'soon', stage: 'contract', event_date: '2026-10-20' }),
        client({ id: 'far', stage: 'event', event_date: '2027-03-01' }),
        client({ id: 'lead', stage: 'inquiry', event_date: '2026-10-15' }),
      ],
      [],
      now
    )
    expect(upcoming.map((c) => c.id)).toEqual(['soon', 'later'])
  })
})
