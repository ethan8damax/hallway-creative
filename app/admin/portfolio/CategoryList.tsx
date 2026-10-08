'use client'

import Link from 'next/link'
import { useState } from 'react'
import { btn } from '@/components/admin/ui'
import { deleteCategory, reorderCategories } from './actions'

type Row = { id: string; title: string; slug: string; cover_url?: string | null; count: number }

export function CategoryList({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial)
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
    if (!window.confirm(`Delete the ${row.title} category and all ${row.count} items in it? It disappears from the site.`)) return
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
            <div className="flex flex-wrap items-center gap-1">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${row.title} up`} className={btn.quiet}>
                Up
              </button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === rows.length - 1} aria-label={`Move ${row.title} down`} className={btn.quiet}>
                Down
              </button>
              <Link href={`/admin/portfolio/${row.id}`} className={btn.secondary}>
                Edit
              </Link>
              <button type="button" onClick={() => remove(row)} className={btn.danger}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
