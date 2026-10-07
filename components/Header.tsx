'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const NAV_LINKS = [
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function Header() {
  const pathname = usePathname()
  const overHero = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const dialog = menuRef.current
    if (!dialog) return
    if (menuOpen && !dialog.open) dialog.showModal()
    if (!menuOpen && dialog.open) dialog.close()
  }, [menuOpen])

  // Close the menu on navigation.
  useEffect(() => setMenuOpen(false), [pathname])

  // Homepage: only the wordmark sits over the hero photo; the nav arrives once
  // the visitor starts scrolling. Every other page shows it from the start.
  const navShown = !overHero || scrolled
  const solid = !overHero || scrolled

  return (
    <header
      className={`${overHero ? 'fixed inset-x-0' : 'sticky'} top-0 z-40 transition-[background-color,border-color] duration-500 ${
        solid ? 'border-b border-border bg-bg/90 backdrop-blur-md' : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <Link
          href="/"
          className={`font-display text-xl tracking-[-0.01em] transition-colors duration-500 ${solid ? 'text-ink' : 'on-photo'}`}
        >
          HallWay Creative
        </Link>

        <div
          className={`flex items-center gap-8 transition-[opacity,transform,visibility] duration-500 ease-[var(--ease-out-expo)] ${
            navShown ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'
          }`}
        >
          <ul className="hidden gap-8 text-[0.9375rem] text-ink sm:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={`border-b-2 pb-1 transition-colors ${
                      active ? 'border-tally' : 'border-transparent hover:border-border'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="text-sm font-medium text-ink sm:hidden"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
          >
            Menu
          </button>
        </div>
      </nav>

      <dialog
        ref={menuRef}
        onClose={() => setMenuOpen(false)}
        aria-label="Site menu"
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-bg p-0 text-ink"
      >
        <div className="flex items-center justify-between px-5 py-4">
          <Link href="/" className="font-display text-xl">
            HallWay Creative
          </Link>
          <button type="button" onClick={() => setMenuOpen(false)} className="text-sm font-medium">
            Close
          </button>
        </div>
        <ul className="mt-12 flex flex-col gap-2 px-5">
          {NAV_LINKS.map((link, i) => (
            <li key={link.href} className="overflow-hidden">
              <Link
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`${menuOpen ? 'hero-rise' : ''} block py-2 font-display text-[2.75rem] leading-none tracking-[-0.02em]`}
                style={{ animationDelay: `${80 + i * 70}ms` }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </dialog>
    </header>
  )
}
