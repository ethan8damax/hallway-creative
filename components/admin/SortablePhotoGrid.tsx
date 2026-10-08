'use client'

import { useState } from 'react'

export type GridPhoto = { id: string; src: string; label?: string }

function move<T>(list: T[], from: number, to: number) {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// Drag to reorder (or use the arrow buttons — keyboard and touch friendly).
// The first photo is the cover everywhere it's shown publicly.
export function SortablePhotoGrid({
  photos,
  onReorder,
  onDelete,
  renderExtra,
}: {
  photos: GridPhoto[]
  onReorder: (ids: string[]) => void
  onDelete: (id: string) => void
  renderExtra?: (photo: GridPhoto) => React.ReactNode
}) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const reorder = (from: number, to: number) => {
    if (from === to || to < 0 || to >= photos.length) return
    onReorder(move(photos, from, to).map((p) => p.id))
  }

  // as many ~170px columns as the panel fits, so the controls never get cramped
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
      {photos.map((photo, index) => (
        <li
          key={photo.id}
          draggable
          onDragStart={(e) => {
            setDragId(photo.id)
            e.dataTransfer.effectAllowed = 'move'
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setOverId(photo.id)
          }}
          onDragEnd={() => {
            setDragId(null)
            setOverId(null)
          }}
          onDrop={(e) => {
            e.preventDefault()
            if (dragId) reorder(photos.findIndex((p) => p.id === dragId), index)
            setDragId(null)
            setOverId(null)
          }}
          className={`group relative flex flex-col overflow-hidden rounded-xs border bg-surface transition-[border-color,opacity] ${
            overId === photo.id && dragId !== photo.id ? 'border-monitor' : 'border-border'
          } ${dragId === photo.id ? 'opacity-40' : ''}`}
        >
          <div className="relative aspect-[4/3] cursor-grab overflow-hidden active:cursor-grabbing">
            {/* absolute, so a tall portrait fills the 4:3 frame instead of stretching it */}
            <img src={photo.src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
            {index === 0 && (
              <span className="absolute left-2 top-2 rounded-xs bg-bg/85 px-1.5 py-0.5 text-xs font-medium text-ink">Cover</span>
            )}
            <button
              type="button"
              onClick={() => onDelete(photo.id)}
              aria-label={`Delete ${photo.label ?? 'photo'}`}
              title="Delete"
              className="absolute right-2 top-2 rounded-xs bg-bg/85 p-1.5 text-tally-text transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:outline-monitor"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-0.5 px-1 py-1">
            <button type="button" onClick={() => reorder(index, index - 1)} disabled={index === 0} aria-label="Move earlier" className="rounded-xs px-1.5 py-0.5 text-sm text-muted hover:bg-bg hover:text-ink disabled:opacity-30">
              ←
            </button>
            <button type="button" onClick={() => reorder(index, index + 1)} disabled={index === photos.length - 1} aria-label="Move later" className="rounded-xs px-1.5 py-0.5 text-sm text-muted hover:bg-bg hover:text-ink disabled:opacity-30">
              →
            </button>
            {index > 0 && (
              <button type="button" onClick={() => reorder(index, 0)} title="Make this the cover" aria-label="Make this the cover" className="rounded-xs px-1.5 py-0.5 text-xs text-muted hover:bg-bg hover:text-ink">
                Set cover
              </button>
            )}
          </div>
          {renderExtra?.(photo)}
        </li>
      ))}
    </ul>
  )
}
