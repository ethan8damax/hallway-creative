'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ITEMS = [
  { href: '/admin', label: 'Today', icon: 'M3 12h4l3-8 4 16 3-8h4' },
  { href: '/admin/clients', label: 'Clients', icon: 'M16 19a4 4 0 0 0-8 0M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6M20 19a3 3 0 0 0-3-3M4 19a3 3 0 0 1 3-3' },
  { href: '/admin/galleries', label: 'Galleries', icon: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5' },
  { href: '/admin/portfolio', label: 'Portfolio', icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
  { href: '/admin/site', label: 'Site', icon: 'M4 6h16M4 12h16M4 18h10' },
]

function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

export function AdminNav({ newInquiries }: { newInquiries: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))

  async function signOut() {
    await createClient().auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <>
      {/* Desktop: sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border px-3 py-5 md:flex">
        <Link href="/admin" className="px-3 font-display text-lg text-ink">
          HallWay
        </Link>
        <nav aria-label="Admin" className="mt-8 flex flex-col gap-0.5">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xs px-3 py-2 text-sm transition-colors ${
                isActive(item.href) ? 'bg-surface font-medium text-ink' : 'text-muted hover:bg-surface/60 hover:text-ink'
              }`}
            >
              <Icon d={item.icon} />
              {item.label}
              {item.href === '/admin/clients' && newInquiries > 0 && (
                <span className="ml-auto rounded-xs bg-tally px-1.5 text-xs font-semibold tabular-nums text-on-accent" aria-label={`${newInquiries} new`}>
                  {newInquiries}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-0.5 border-t border-border pt-3">
          <Link href="/" target="_blank" className="rounded-xs px-3 py-2 text-sm text-muted transition-colors hover:bg-surface/60 hover:text-ink">
            View site ↗
          </Link>
          <Link href="/admin/account" className="rounded-xs px-3 py-2 text-sm text-muted transition-colors hover:bg-surface/60 hover:text-ink">
            Account
          </Link>
          <button type="button" onClick={signOut} className="rounded-xs px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-surface/60 hover:text-ink">
            Sign out
          </button>
        </div>
      </aside>

      {/* Phone: bottom tab bar */}
      <nav aria-label="Admin" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.6875rem] ${isActive(item.href) ? 'text-ink' : 'text-muted'}`}
          >
            <Icon d={item.icon} />
            {item.label}
            {item.href === '/admin/clients' && newInquiries > 0 && (
              <span className="absolute right-[calc(50%-1.25rem)] top-1.5 h-2 w-2 rounded-full bg-tally" aria-label={`${newInquiries} new`} />
            )}
          </Link>
        ))}
      </nav>
    </>
  )
}
