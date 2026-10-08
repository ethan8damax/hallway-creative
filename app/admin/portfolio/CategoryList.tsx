'use client'

import Link from 'next/link'
import { useState } from 'react'
import { btn } from '@/components/admin/ui'
import { deleteCategory, reorderCategories } from './actions'
import { useConfirm } from '@/components/admin/ConfirmDialog'

// SVG, not text glyphs: arrow characters render as emoji on Apple devices.
function Icon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const iconBtn =
  'flex items-center justify-center rounded-xs p-1 text-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-monitor'

type Row = { id: string; title: string; slug: string; cover_url?: string | null; count: number }

export function CategoryList({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial)
  const confirm = useConfirm()
  const [error, setError] = useState(false)

  async function move(from: number, to: number) {
    if (to < 0 || to >= rows.length) return
    const previous = rows
    const next = [...rows]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setRows(next)
    setError(false)
    try {
      await reorderCategories(next.map((r) => r.id))
    } catch {
      setRows(previous)
      setError(true)
    }
  }

  async function remove(row: Row) {
    const ok = await confirm({
      title: `Delete the ${row.title} category?`,
      body: `All ${row.count} ${row.count === 1 ? 'item' : 'items'} in it come off the site, and the photo files are permanently deleted. This can’t be undone.`,
      confirmLabel: 'Delete category',
      requireText: row.title,
    })
    if (!ok) return
    setError(false)
    try {
      await deleteCategory(row.id)
      setRows((all) => all.filter((r) => r.id !== row.id))
    } catch {
      setError(true)
    }
  }

  return (
    <>
      {error && (
        <p role="alert" className="mb-3 text-sm text-tally-text">
          Something didn&apos;t save. Try again.
        </p>
      )}
      <ul className="divide-y divide-border rounded-md border border-border">
        {rows.map((row, i) => (
          <li key={row.id} className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center">
            <Link href={`/admin/portfolio/${row.id}`} className="flex min-w-0 flex-1 items-center gap-4 rounded-xs hover:text-ink">
              <span className="h-12 w-16 shrink-0 overflow-hidden rounded-xs bg-surface">
                {row.cover_url && <img src={row.cover_url} alt="" className="h-full w-full object-cover" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{row.title}</span>
                <span className="block text-xs text-muted">
                  {row.count} {row.count === 1 ? 'item' : 'items'} · /portfolio/{row.slug}
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${row.title} up`} title="Move up" className={iconBtn}>
                  <Icon d="M12 19V5M5 12l7-7 7 7" />
                </button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === rows.length - 1} aria-label={`Move ${row.title} down`} title="Move down" className={iconBtn}>
                  <Icon d="M12 5v14M5 12l7 7 7-7" />
                </button>
              </div>
              <Link href={`/admin/portfolio/${row.id}`} className={btn.secondary}>
                Edit
              </Link>
              <button type="button" onClick={() => remove(row)} aria-label={`Delete ${row.title}`} title="Delete" className={`${iconBtn} p-2 text-tally-text hover:text-tally-text`}>
                <Icon d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
