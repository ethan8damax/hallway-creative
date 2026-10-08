'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin'
import { saveOrder } from '@/lib/saveOrder'

const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim() || null

function refreshPublic() {
  revalidatePath('/', 'layout')
}

export async function updateSiteSettings(id: string, formData: FormData): Promise<void> {
  await requireAdmin()
  const instagram = text(formData, 'instagram_url')
  if (instagram && !/^https?:\/\//.test(instagram)) throw new Error('The Instagram link should start with https://')
  const { error } = await createServiceClient()
    .from('site_settings')
    .update({
      hero_headline: text(formData, 'hero_headline'),
      hero_subtext: text(formData, 'hero_subtext'),
      contact_email: text(formData, 'contact_email'),
      instagram_url: instagram,
    })
    .eq('id', id)
  if (error) throw error
  refreshPublic()
}

export async function updateBio(id: string, formData: FormData): Promise<void> {
  await requireAdmin()
  const { error } = await createServiceClient().from('about').update({ bio: text(formData, 'bio') }).eq('id', id)
  if (error) throw error
  refreshPublic()
}

export async function setPortrait(id: string, portrait: { key: string; url: string }) {
  await requireAdmin()
  const { error } = await createServiceClient().from('about').update({ portrait_r2_key: portrait.key, portrait_url: portrait.url }).eq('id', id)
  if (error) throw error
  refreshPublic()
}

export async function addService(formData: FormData): Promise<void> {
  await requireAdmin()
  const title = text(formData, 'title')
  const description = text(formData, 'description')
  if (!title || !description) throw new Error('A service needs a name and a description.')
  const db = createServiceClient()
  const { data: last } = await db.from('services').select('sort_order').order('sort_order', { ascending: false }).limit(1)
  const { error } = await db
    .from('services')
    .insert({ title, description, category_id: text(formData, 'category_id'), sort_order: (last?.[0]?.sort_order ?? -1) + 1 })
  if (error) throw error
  refreshPublic()
}

export async function updateService(id: string, formData: FormData): Promise<void> {
  await requireAdmin()
  const title = text(formData, 'title')
  const description = text(formData, 'description')
  if (!title || !description) throw new Error('A service needs a name and a description.')
  const { error } = await createServiceClient()
    .from('services')
    .update({ title, description, category_id: text(formData, 'category_id') })
    .eq('id', id)
  if (error) throw error
  refreshPublic()
}

export async function deleteService(id: string) {
  await requireAdmin()
  const { error } = await createServiceClient().from('services').delete().eq('id', id)
  if (error) throw error
  refreshPublic()
}

export async function reorderServices(ids: string[]) {
  await requireAdmin()
  await saveOrder('services', ids)
  refreshPublic()
}
