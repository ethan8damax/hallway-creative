import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { createGallery } from './actions'
import type { Gallery } from '@/lib/supabase/types'

export default async function AdminGalleriesPage() {
  const { data: galleries } = await createServiceClient()
    .from('galleries')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h2 className="font-display text-2xl">Galleries</h2>
      <ul className="mt-6 flex flex-col gap-3">
        {(galleries as Gallery[] | null)?.map((gallery) => (
          <li key={gallery.id}>
            <Link href={`/admin/galleries/${gallery.id}`} className="text-ink hover:text-tally">
              {gallery.title} — {gallery.client_name} ({gallery.status})
            </Link>
          </li>
        ))}
      </ul>

      <form
        action={async (formData) => {
          'use server'
          await createGallery({
            title: formData.get('title') as string,
            clientName: formData.get('clientName') as string,
            clientEmail: formData.get('clientEmail') as string,
            eventDate: formData.get('eventDate') as string,
            accessCode: formData.get('accessCode') as string,
          })
        }}
        className="mt-8 flex max-w-sm flex-col gap-3"
      >
        <input name="title" placeholder="Gallery title" required className="border-b border-border bg-transparent py-2" />
        <input name="clientName" placeholder="Client name" required className="border-b border-border bg-transparent py-2" />
        <input name="clientEmail" type="email" placeholder="Client email" required className="border-b border-border bg-transparent py-2" />
        <input name="eventDate" type="date" className="border-b border-border bg-transparent py-2" />
        <input name="accessCode" placeholder="Access code" required className="border-b border-border bg-transparent py-2" />
        <button type="submit" className="w-fit rounded-xs bg-tally px-6 py-3 font-semibold text-on-accent">
          Create gallery
        </button>
      </form>
    </div>
  )
}
