import { isExpired } from './galleryExpiry'
import type { Client, Gallery } from './supabase/types'

export type TodayGallery = Pick<Gallery, 'id' | 'title' | 'client_name' | 'status' | 'sent_at' | 'first_viewed_at' | 'expires_on'>
export type Task = { key: string; href: string; title: string; detail: string; tone: 'new' | 'warn' | 'neutral'; tag: string }

const DAY = 86_400_000
const short = (d: string) => new Date(d.length === 10 ? `${d}T00:00:00Z` : d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

// Everything waiting on Andrew, most urgent first, plus the next six weeks of events.
export function buildToday(clients: Client[], galleries: TodayGallery[], now = new Date()) {
  const today = now.toISOString().slice(0, 10)
  const inDays = (n: number) => new Date(now.getTime() + n * DAY).toISOString().slice(0, 10)

  const tasks: Task[] = [
    ...clients
      .filter((c) => c.is_new)
      .map((c) => ({
        key: `new-${c.id}`,
        href: `/admin/clients/${c.id}`,
        title: `Reply to ${c.name}`,
        detail: [c.event_type, c.event_date && short(c.event_date)].filter(Boolean).join(' · ') || 'New inquiry',
        tone: 'new' as const,
        tag: 'New inquiry',
      })),
    ...clients
      .filter((c) => c.stage === 'event' && c.event_date && c.event_date < today)
      .map((c) => ({
        key: `shot-${c.id}`,
        href: `/admin/clients/${c.id}`,
        title: `${c.name}: event is done`,
        detail: `Shot ${short(c.event_date!)}. Move them to the Red Room when you start editing.`,
        tone: 'neutral' as const,
        tag: 'Pipeline',
      })),
    ...galleries
      .filter((g) => g.status === 'published' && !g.sent_at && !isExpired(g.expires_on, now))
      .map((g) => ({
        key: `send-${g.id}`,
        href: `/admin/galleries/${g.id}`,
        title: `Send “${g.title}”`,
        detail: `Published but ${g.client_name} hasn't been emailed yet.`,
        tone: 'warn' as const,
        tag: 'Gallery',
      })),
    ...galleries
      .filter((g) => g.sent_at && !g.first_viewed_at && now.getTime() - new Date(g.sent_at).getTime() > 3 * DAY)
      .map((g) => ({
        key: `nudge-${g.id}`,
        href: `/admin/galleries/${g.id}`,
        title: `Check in with ${g.client_name}`,
        detail: `“${g.title}” was sent ${short(g.sent_at!)} and hasn't been opened.`,
        tone: 'warn' as const,
        tag: 'Gallery',
      })),
    ...galleries
      .filter((g) => g.expires_on && !isExpired(g.expires_on, now) && g.expires_on <= inDays(7))
      .map((g) => ({
        key: `exp-${g.id}`,
        href: `/admin/galleries/${g.id}`,
        title: `“${g.title}” closes soon`,
        detail: `Closes after ${short(g.expires_on!)}. Extend it from the gallery if they need more time.`,
        tone: 'neutral' as const,
        tag: 'Gallery',
      })),
    ...galleries
      .filter((g) => isExpired(g.expires_on, now))
      .map((g) => ({
        key: `closed-${g.id}`,
        href: `/admin/galleries/${g.id}`,
        title: `“${g.title}” has closed`,
        detail: `Closed after ${short(g.expires_on!)}. Delete it to free up storage, or set a later date to reopen it.`,
        tone: 'neutral' as const,
        tag: 'Cleanup',
      })),
  ]

  const upcoming = clients
    .filter((c) => c.event_date && c.event_date >= today && c.event_date <= inDays(45) && ['conversation', 'contract', 'event'].includes(c.stage))
    .sort((a, b) => a.event_date!.localeCompare(b.event_date!))

  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return { tasks, upcoming, dateLabel }
}
