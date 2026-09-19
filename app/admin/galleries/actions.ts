'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { hashAccessCode } from '@/lib/accessCode'
import { slugify, isDuplicateSlugError } from '@/lib/slugify'
import type { Photo } from '@/lib/supabase/types'

export async function createGallery(input: { title: string; clientName: string; clientEmail: string; eventDate: string; accessCode: string }) {
  if (!input.accessCode.trim()) {
    throw new Error('Access code is required.')
  }

  const access_code_hash = await hashAccessCode(input.accessCode)
  const { error } = await createServiceClient().from('galleries').insert({
    title: input.title,
    client_name: input.clientName,
    client_email: input.clientEmail,
    slug: slugify(input.title),
    event_date: input.eventDate || null,
    access_code_hash,
    status: 'draft',
  })
  if (error) {
    if (isDuplicateSlugError(error)) {
      throw new Error('A gallery with that title already exists.')
    }
    throw error
  }
  revalidatePath('/admin/galleries')
}

export async function addPhoto(
  galleryId: string,
  fields: { r2_key: string; url: string; preview_url: string; width: number; height: number; filename: string }
): Promise<Photo> {
  const { data, error } = await createServiceClient()
    .from('photos')
    .insert({ gallery_id: galleryId, sort_order: 0, ...fields })
    .select()
    .single()
  if (error) throw error
  revalidatePath(`/admin/galleries/${galleryId}`)
  return data as Photo
}

export async function deletePhoto(id: string, galleryId: string) {
  const { error } = await createServiceClient().from('photos').delete().eq('id', id).eq('gallery_id', galleryId)
  if (error) throw error
  revalidatePath(`/admin/galleries/${galleryId}`)
}

export async function togglePublish(id: string, status: 'draft' | 'published') {
  const { error } = await createServiceClient().from('galleries').update({ status }).eq('id', id)
  if (error) throw error
  revalidatePath(`/admin/galleries/${id}`)
  revalidatePath('/admin/galleries')
}
