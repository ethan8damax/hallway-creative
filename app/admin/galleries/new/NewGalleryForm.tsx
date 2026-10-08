'use client'

import { useRouter } from 'next/navigation'
import { ActionForm } from '@/components/admin/ActionForm'
import { Field, inputClass } from '@/components/admin/ui'
import { createGallery } from '../actions'

type Prefill = { clientId?: string; title?: string; clientName?: string; clientEmail?: string; eventDate?: string }

export function NewGalleryForm({ prefill, clients }: { prefill: Prefill; clients: { id: string; name: string }[] }) {
  const router = useRouter()
  return (
    <ActionForm action={createGallery} submitLabel="Create gallery" onSuccess={(id) => router.push(`/admin/galleries/${id}`)}>
      <Field label="Gallery title" hint="Clients see this. It also becomes the link, e.g. /gallery/jordan-sam-wedding.">
        <input name="title" required defaultValue={prefill.title} className={inputClass} />
      </Field>
      <Field label="Client" hint="Links the gallery to their pipeline card.">
        <select name="client_id" defaultValue={prefill.clientId ?? ''} className={inputClass}>
          <option value="">No linked client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client name (as shown in the email)">
          <input name="client_name" required defaultValue={prefill.clientName} className={inputClass} />
        </Field>
        <Field label="Client email">
          <input name="client_email" type="email" required defaultValue={prefill.clientEmail} className={inputClass} />
        </Field>
        <Field label="Event date">
          <input name="event_date" type="date" defaultValue={prefill.eventDate} className={inputClass} />
        </Field>
        <Field label="Closes after" hint="Optional.">
          <input name="expires_on" type="date" className={inputClass} />
        </Field>
      </div>
      <Field label="Access code" hint="Something easy to type, like lakeside-2026. You'll include it when you send the gallery.">
        <input name="access_code" required autoComplete="off" className={`${inputClass} sm:max-w-xs`} />
      </Field>
    </ActionForm>
  )
}
