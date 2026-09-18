import type { SiteSettings } from '@/lib/supabase/types'
import { ThemeToggle } from './ThemeToggle'

export function Footer({ settings }: { settings: SiteSettings | null }) {
  return (
    <footer className="border-t border-border px-6 py-10 text-center text-sm text-muted">
      <p>&copy; {new Date().getFullYear()} HallWay Creative</p>
      <div className="mt-3 flex items-center justify-center gap-6">
        {settings?.contact_email && (
          <a href={`mailto:${settings.contact_email}`} className="transition-colors hover:text-ink">
            {settings.contact_email}
          </a>
        )}
        {settings?.instagram_url && (
          <a
            href={settings.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-ink"
          >
            Instagram
          </a>
        )}
        <ThemeToggle />
      </div>
    </footer>
  )
}
