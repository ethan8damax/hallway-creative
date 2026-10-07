'use client'

import { useEffect, useRef } from 'react'

export type LightboxItem = { src: string; alt: string; downloadUrl?: string; filename?: string }

// Native <dialog> gives us Esc-to-close, focus trapping and the top layer for free.
export function Lightbox({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: LightboxItem[]
  index: number | null
  onIndexChange: (index: number) => void
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const touchStartX = useRef<number | null>(null)
  const open = index !== null
  const count = items.length

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (index === null) return
    const current = index
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') onIndexChange((current + 1) % count)
      if (e.key === 'ArrowLeft') onIndexChange((current - 1 + count) % count)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, count, onIndexChange])

  // Warm the neighbours so arrowing through feels instant.
  useEffect(() => {
    if (index === null || count < 2) return
    for (const n of [index + 1, index - 1]) {
      const img = new Image()
      img.src = items[(n + count) % count].src
    }
  }, [index, count, items])

  const item = index !== null ? items[index] : null
  const step = (delta: number) => index !== null && onIndexChange((index + delta + count) % count)

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label="Photo viewer"
      className="m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-[oklch(0.06_0_0)] p-0 text-[oklch(0.95_0_0)]"
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
        touchStartX.current = null
      }}
    >
      {item && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-4 text-sm sm:px-8">
            <span className="tabular-nums opacity-70">
              {index! + 1} / {count}
            </span>
            <div className="flex items-center gap-6">
              {item.downloadUrl && (
                <a href={item.downloadUrl} download={item.filename} className="font-medium underline-offset-4 hover:underline">
                  Download
                </a>
              )}
              <button type="button" onClick={onClose} className="font-medium" autoFocus>
                Close
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6 sm:px-20">
            {/* key forces a fresh element per photo so the fade replays */}
            <img key={item.src} src={item.src} alt={item.alt} className="fade-in max-h-full max-w-full object-contain" />
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous photo"
                  className="absolute inset-y-0 left-0 hidden w-20 items-center justify-center text-2xl opacity-60 transition-opacity hover:opacity-100 sm:flex"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next photo"
                  className="absolute inset-y-0 right-0 hidden w-20 items-center justify-center text-2xl opacity-60 transition-opacity hover:opacity-100 sm:flex"
                >
                  →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </dialog>
  )
}
