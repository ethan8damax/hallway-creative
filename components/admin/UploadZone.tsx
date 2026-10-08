'use client'

import { useEffect, useRef, useState } from 'react'
import { btn } from './ui'

export type UploadResult = { key: string; url: string; previewUrl: string; width: number; height: number; filename: string }

type Job = { file: File; status: 'queued' | 'uploading' | 'done' | 'failed' }

// ponytail: 3 at a time keeps a phone on venue Wi-Fi responsive; raise it if
// desktop uploads feel slow.
const CONCURRENCY = 3

function downscale(bitmap: ImageBitmap, maxWidth: number): Promise<Blob> {
  const scale = Math.min(1, maxWidth / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))), 'image/jpeg', 0.85))
}

async function uploadOne(file: Blob, filename: string, contentType: string, prefix: string): Promise<{ key: string; url: string }> {
  const presignResponse = await fetch('/api/r2/presign', {
    method: 'POST',
    body: JSON.stringify({ filename, contentType, prefix }),
  })
  if (!presignResponse.ok) throw new Error(`Failed to get an upload URL for ${filename}`)
  const { uploadUrl, key, publicUrl } = await presignResponse.json()
  const putResponse = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': contentType } })
  if (!putResponse.ok) throw new Error(`Failed to upload ${filename}`)
  return { key, url: publicUrl }
}

async function processFile(file: File, prefix: string): Promise<UploadResult> {
  const bitmap = await createImageBitmap(file)
  const preview = await downscale(bitmap, 1600)
  const [original, previewUpload] = await Promise.all([
    uploadOne(file, file.name, file.type, prefix),
    uploadOne(preview, `preview-${file.name}`, 'image/jpeg', prefix),
  ])
  return { key: original.key, url: original.url, previewUrl: previewUpload.url, width: bitmap.width, height: bitmap.height, filename: file.name }
}

export function UploadZone({
  prefix,
  onUploaded,
  existingNames,
}: {
  prefix: string
  // saves the DB row; awaited so a failed save counts as a failed upload
  onUploaded: (result: UploadResult) => Promise<void>
  existingNames?: Set<string>
}) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [skipped, setSkipped] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const active = jobs.some((j) => j.status === 'queued' || j.status === 'uploading')
  const done = jobs.filter((j) => j.status === 'done').length
  const failed = jobs.filter((j) => j.status === 'failed')

  // Leaving mid-upload would silently drop the rest of the batch.
  useEffect(() => {
    if (!active) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [active])

  const setStatus = (file: File, status: Job['status']) => setJobs((all) => all.map((j) => (j.file === file ? { ...j, status } : j)))

  async function run(files: File[]) {
    const queue = [...files]
    const worker = async () => {
      for (let file = queue.shift(); file; file = queue.shift()) {
        setStatus(file, 'uploading')
        try {
          await onUploaded(await processFile(file, prefix))
          setStatus(file, 'done')
        } catch {
          setStatus(file, 'failed')
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  }

  function add(fileList: FileList | File[]) {
    const images = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    const seen = new Set([...(existingNames ?? []), ...jobs.map((j) => j.file.name)])
    const fresh = images.filter((f) => !seen.has(f.name))
    setSkipped(images.filter((f) => seen.has(f.name)).map((f) => f.name))
    if (fresh.length === 0) return
    // a finished batch is cleared when a new one starts
    setJobs((all) => [...(active ? all : all.filter((j) => j.status === 'failed')), ...fresh.map((file) => ({ file, status: 'queued' as const }))])
    run(fresh)
  }

  function retryFailed() {
    const files = failed.map((j) => j.file)
    setJobs((all) => all.map((j) => (j.status === 'failed' ? { ...j, status: 'queued' } : j)))
    run(files)
  }

  const total = jobs.length

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          add(e.dataTransfer.files)
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-md border border-dashed px-6 py-10 text-center transition-colors ${
          dragging ? 'border-monitor bg-surface/70' : 'border-border'
        }`}
      >
        <p className="text-sm text-ink">Drag photos here</p>
        <p className="text-xs text-muted">or</p>
        <button type="button" onClick={() => inputRef.current?.click()} className={btn.secondary}>
          Choose photos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) add(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {total > 0 && (
        <div className="mt-4" role="status" aria-live="polite">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-ink">
              {active ? `Uploading ${done} of ${total}…` : `${done} of ${total} uploaded`}
              {active && <span className="text-muted"> Keep this page open.</span>}
            </span>
            {failed.length > 0 && !active && (
              <button type="button" onClick={retryFailed} className={btn.secondary}>
                Retry {failed.length} failed
              </button>
            )}
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface">
            <div className="h-full bg-monitor transition-[width] duration-300" style={{ width: `${(done / total) * 100}%` }} />
          </div>
          {failed.length > 0 && (
            <p className="mt-2 text-xs text-tally-text">
              Didn&apos;t upload: {failed.map((j) => j.file.name).join(', ')}
            </p>
          )}
        </div>
      )}
      {skipped.length > 0 && (
        <p className="mt-2 text-xs text-muted">
          Skipped {skipped.length} already in this set: {skipped.slice(0, 5).join(', ')}
          {skipped.length > 5 ? '…' : ''}
        </p>
      )}
    </div>
  )
}
