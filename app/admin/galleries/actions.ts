'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin'
import { hashAccessCode } from '@/lib/accessCode'
import { slugify, isDuplicateSlugError } from '@/lib/slugify'
import { saveOrder } from '@/lib/saveOrder'
import type { Photo } from '@/lib/supabase/types'

const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim() || null

function refresh(id?: string) {
  revalidatePath('/admin', 'layout')
  if (id) revalidatePath(`/admin/galleries/${id}`)
}

export async function createGallery(formData: FormData): Promise<string> {
  await requireAdmin()
  const title = text(formData, 'title')
  const clientName = text(formData, 'client_name')
  const clientEmail = text(formData, 'client_email')
  const accessCode = text(formData, 'access_code')
  const clientId = text(formData, 'client_id')
  if (!title || !clientName || !clientEmail) throw new Error('Title, client name and client email are required.')
  if (!accessCode) throw new Error('Access code is required.')

  const db = createServiceClient()
  const { data, error } = await db
    .from('galleries')
    .insert({
      title,
      client_name: clientName,
      client_email: clientEmail,
      client_id: clientId,
      slug: slugify(title),
      event_date: text(formData, 'event_date'),
      expires_on: text(formData, 'expires_on'),
      access_code_hash: await hashAccessCode(accessCode),
      status: 'draft',
    })
    .select('id')
    .single()
  if (error) {
    if (isDuplicateSlugError(error)) throw new Error('A gallery with that title already exists. Try adding the date.')
    throw error
  }
  if (clientId) {
    await db.from('client_activity').insert({ client_id: clientId, kind: 'gallery', body: `Created gallery “${title}”` })
  }
  refresh()
  return data.id
}

export async function updateGallery(id: string, formData: FormData): Promise<void> {
  await requireAdmin()
  const title = text(formData, 'title')
  const clientName = text(formData, 'client_name')
  const clientEmail = text(formData, 'client_email')
  if (!title || !clientName || !clientEmail) throw new Error('Title, client name and client email are required.')
  // the slug (and so the link already sent to the client) never changes
  const { error } = await createServiceClient()
    .from('galleries')
    .update({ title, client_name: clientName, client_email: clientEmail, event_date: text(formData, 'event_date'), expires_on: text(formData, 'expires_on') })
    .eq('id', id)
  if (error) throw error
  refresh(id)
}

// A new code signs everyone out of the gallery (unlock cookies are bound to the code's hash).
export async function changeAccessCode(id: string, formData: FormData): Promise<void> {
  await requireAdmin()
  const code = text(formData, 'access_code')
  if (!code) throw new Error('Enter the new code.')
  const { error } = await createServiceClient().from('galleries').update({ access_code_hash: await hashAccessCode(code) }).eq('id', id)
  if (error) throw error
  refresh(id)
}

export async function addPhoto(
  galleryId: string,
  fields: { r2_key: string; url: string; preview_url: string; width: number; height: number; filename: string; sort_order: number }
): Promise<Photo> {
  await requireAdmin()
  const { data, error } = await createServiceClient()
    .from('photos')
    .insert({ gallery_id: galleryId, ...fields })
    .select()
    .single()
  if (error) throw error
  return data as Photo
}

export async function deletePhoto(id: string, galleryId: string) {
  await requireAdmin()
  const { error } = await createServiceClient().from('photos').delete().eq('id', id).eq('gallery_id', galleryId)
  if (error) throw error
  refresh(galleryId)
}

export async function reorderPhotos(galleryId: string, ids: string[]) {
  await requireAdmin()
  await saveOrder('photos', ids)
  refresh(galleryId)
}

export async function togglePublish(id: string, status: 'draft' | 'published') {
  await requireAdmin()
  const { error } = await createServiceClient().from('galleries').update({ status }).eq('id', id)
  if (error) throw error
  refresh(id)
  revalidatePath('/admin/galleries')
}

// ponytail: removes the gallery and its photo rows; the files stay in R2.
// Add an R2 batch delete if storage cost ever matters.
export async function deleteGallery(id: string) {
  await requireAdmin()
  const { error } = await createServiceClient().from('galleries').delete().eq('id', id)
  if (error) throw error
  refresh()
  revalidatePath('/admin/galleries')
}
