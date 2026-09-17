import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-border px-6 py-4">
        <nav className="mx-auto flex max-w-5xl gap-6 text-sm">
          <Link href="/admin" className="font-display text-lg">
            Admin
          </Link>
          <Link href="/admin/content">Content</Link>
          <Link href="/admin/portfolio">Portfolio</Link>
          <Link href="/admin/galleries">Galleries</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  )
}
