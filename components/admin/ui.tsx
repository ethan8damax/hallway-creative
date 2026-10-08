// Shared admin vocabulary. One button shape, one field style, one panel —
// so "Save" looks the same on every screen.

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-xs bg-tally px-4 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-tally-deep disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-monitor',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-xs border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-monitor',
  quiet:
    'inline-flex items-center gap-1.5 rounded-xs px-2 py-1 text-sm text-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-monitor',
  danger:
    'inline-flex items-center gap-1.5 rounded-xs px-2 py-1 text-sm text-tally-text transition-colors hover:bg-surface disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-monitor',
}

export const inputClass =
  'w-full rounded-xs border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted transition-colors focus:border-monitor focus:outline-none [color-scheme:dark] [.light_&]:[color-scheme:light]'

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, description, children, className = '' }: { title?: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-md border border-border bg-surface/40 p-5 sm:p-6 ${className}`}>
      {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className={title || description ? 'mt-5' : ''}>{children}</div>
    </section>
  )
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border px-6 py-10 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-sm text-sm text-muted">{children}</div>}
    </div>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'new' | 'good' | 'warn' }) {
  const tones = {
    neutral: 'border-border text-muted',
    new: 'border-tally/50 text-tally-text',
    good: 'border-monitor/50 text-monitor',
    warn: 'border-ink/40 text-ink',
  }
  return <span className={`inline-flex items-center rounded-xs border px-1.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>
}

export function formatDate(date: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!date) return null
  // plain `YYYY-MM-DD` dates are calendar days — pin to UTC so they never shift
  const d = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : new Date(date)
  return d.toLocaleDateString('en-US', { ...opts, ...(date.length === 10 ? { timeZone: 'UTC' } : {}) })
}
