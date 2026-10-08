'use client'

import { useState } from 'react'
import { ActionForm } from '@/components/admin/ActionForm'
import { UploadZone } from '@/components/admin/UploadZone'
import { Field, btn, inputClass } from '@/components/admin/ui'
import type { Service } from '@/lib/supabase/types'
import { deleteService, reorderServices, setPortrait, updateService } from './actions'
import { useConfirm } from '@/components/admin/ConfirmDialog'

export function PortraitEditor({ aboutId, initialUrl }: { aboutId: string; initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl)
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="aspect-[4/5] w-32 shrink-0 overflow-hidden rounded-xs bg-surface">
        {url ? <img src={url} alt="Current portrait" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-xs text-muted">No portrait</span>}
      </div>
      <div className="flex-1">
        <UploadZone
          prefix="about"
          onUploaded={async (result) => {
            await setPortrait(aboutId, { key: result.key, url: result.previewUrl })
            setUrl(result.previewUrl)
          }}
        />
      </div>
    </div>
  )
}

export function ServiceList({ initial, categories }: { initial: Service[]; categories: { id: string; title: string }[] }) {
  const [services, setServices] = useState(initial)
  const confirm = useConfirm()
  const [error, setError] = useState<string | null>(null)

  async function move(from: number, to: number) {
    if (to < 0 || to >= services.length) return
    const previous = services
    const next = [...services]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setServices(next)
    try {
      await reorderServices(next.map((s) => s.id))
    } catch {
      setServices(previous)
      setError('Could not save the new order. Try again.')
    }
  }

  async function remove(service: Service) {
    const ok = await confirm({
      title: `Remove “${service.title}”?`,
      body: 'It comes off the services page right away. This can’t be undone.',
      confirmLabel: 'Remove service',
    })
    if (!ok) return
    await deleteService(service.id)
    setServices((all) => all.filter((s) => s.id !== service.id))
  }

  if (services.length === 0) return <p className="text-sm text-muted">No services yet. Add your first one below.</p>

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="text-sm text-tally-text">
          {error}
        </p>
      )}
      {services.map((service, i) => (
        <div key={service.id} className="rounded-md border border-border p-4">
          <ActionForm action={updateService.bind(null, service.id)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input name="title" required defaultValue={service.title} className={inputClass} />
              </Field>
              <Field label="Links to portfolio category">
                <select name="category_id" defaultValue={service.category_id ?? ''} className={inputClass}>
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Description">
              <textarea name="description" required rows={3} defaultValue={service.description} className={inputClass} />
            </Field>
          </ActionForm>
          <div className="mt-3 flex items-center gap-1 border-t border-border pt-3">
            <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className={btn.quiet}>
              ↑ Move up
            </button>
            <button type="button" onClick={() => move(i, i + 1)} disabled={i === services.length - 1} className={btn.quiet}>
              ↓ Move down
            </button>
            <button type="button" onClick={() => remove(service)} className={`${btn.danger} ml-auto`}>
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
