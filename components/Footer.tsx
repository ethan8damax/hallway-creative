import type { SiteSettings } from '@/lib/sanity/types'

export function Footer({ settings }: { settings: SiteSettings | null }) {
  return (
    <footer className="border-t border-neutral-200 py-8 text-center text-sm text-neutral-500">
      <p>&copy; {new Date().getFullYear()} HallWay Creative</p>
      <div className="mt-2 flex justify-center gap-4">
        {settings?.contactEmail && <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>}
        {settings?.instagramUrl && (
          <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a>
        )}
      </div>
    </footer>
  )
}
