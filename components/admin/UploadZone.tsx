'use client'

import { useState } from 'react'

export type UploadResult = { key: string; url: string; previewUrl: string; width: number; height: number }

async function downscale(file: File, maxWidth: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85))
}

async function uploadOne(file: Blob, filename: string, contentType: string, prefix: string): Promise<{ key: string; url: string }> {
  const presignResponse = await fetch('/api/r2/presign', {
    method: 'POST',
    body: JSON.stringify({ filename, contentType, prefix }),
  })
  const { uploadUrl, key, publicUrl } = await presignResponse.json()
  await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': contentType } })
  return { key, url: publicUrl }
}

export function UploadZone({ prefix, onUploaded }: { prefix: string; onUploaded: (result: UploadResult) => void }) {
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList) {
    setUploading(true)
    for (const file of Array.from(files)) {
      const bitmap = await createImageBitmap(file)
      const preview = await downscale(file, 1600)
      const original = await uploadOne(file, file.name, file.type, prefix)
      const previewUpload = await uploadOne(preview, `preview-${file.name}`, 'image/jpeg', prefix)
      onUploaded({
        key: original.key,
        url: original.url,
        previewUrl: previewUpload.url,
        width: bitmap.width,
        height: bitmap.height,
      })
    }
    setUploading(false)
  }

  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xs border border-dashed border-border bg-surface p-10 text-center text-muted transition-colors hover:border-tally">
      {uploading ? 'Uploading…' : 'Drop photos here or click to select'}
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </label>
  )
}
