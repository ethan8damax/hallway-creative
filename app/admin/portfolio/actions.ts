'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin'
import { slugify, isDuplicateSlugError } from '@/lib/slugify'
import { saveOrder } from '@/lib/saveOrder'
import { getVideoEmbedUrl } from '@/lib/video'
import type { MediaItem } from '@/lib/supabase/types'

const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim() || null

// Portfolio photos appear on the homepage, portfolio, services and contact pages.
function refreshPublic() {
  revalidatePath('/', 'layout')
}

async function nextSortOrder(table: 'categories' | 'portfolio_media', categoryId?: string) {
  let query = createServiceClient().from(table).select('sort_order').order('sort_order', { ascending: false }).limit(1)
  if (categoryId) query = query.eq('category_id', categoryId)
  const { data } = await query
  return (data?.[0]?.sort_order ?? -1) + 1
}

export async function createCategory(formData: FormData): Promise<void> {
  await requireAdmin()
  const title = text(formData, 'title')
  if (!title) throw new Error('Give the category a name.')
  const { error } = await createServiceClient()
    .from('categories')
    .insert({ title, slug: slugify(title), description: text(formData, 'description'), sort_order: await nextSortOrder('categories') })
  if (error) {
    if (isDuplicateSlugError(error)) throw new Error('A category with that name already exists.')
    throw error
  }
  refreshPublic()
}

// The slug (the public URL) stays put when the title changes, so shared links keep working.
export async function updateCategory(id: string, formData: FormData): Promise<void> {
  await requireAdmin()
  const title = text(formData, 'title')
  if (!title) throw new Error('Give the category a name.')
  const { error } = await createServiceClient().from('categories').update({ title, description: text(formData, 'description') }).eq('id', id)
  if (error) throw error
  refreshPublic()
}

export async function deleteCategory(id: string) {
  await requireAdmin()
  const { error } = await createServiceClient().from('categories').delete().eq('id', id)
  if (error) throw error
  refreshPublic()
}

export async function reorderCategories(ids: string[]) {
  await requireAdmin()
  await saveOrder('categories', ids)
  refreshPublic()
}

export async function addMediaItem(
  categoryId: string,
  fields: { r2_key: string; image_url: string; preview_url: string; width: number; height: number; caption?: string }
): Promise<MediaItem> {
  await requireAdmin()
  const { data, error } = await createServiceClient()
    .from('portfolio_media')
    .insert({ category_id: categoryId, media_type: 'image', sort_order: await nextSortOrder('portfolio_media', categoryId), ...fields })
    .select()
    .single()
  if (error) throw error
  refreshPublic()
  return data as MediaItem
}

export async function addVideo(categoryId: string, formData: FormData): Promise<void> {
  await requireAdmin()
  const url = text(formData, 'video_url')
  if (!url || !getVideoEmbedUrl(url)) throw new Error('Paste a YouTube or Vimeo link.')
  const { error } = await createServiceClient()
    .from('portfolio_media')
    .insert({ category_id: categoryId, media_type: 'video', video_url: url, caption: text(formData, 'caption'), sort_order: await nextSortOrder('portfolio_media', categoryId) })
  if (error) throw error
  refreshPublic()
  revalidatePath(`/admin/portfolio/${categoryId}`)
}

export async function updateCaption(id: string, caption: string) {
  await requireAdmin()
  const { error } = await createServiceClient().from('portfolio_media').update({ caption: caption.trim() || null }).eq('id', id)
  if (error) throw error
  refreshPublic()
}

export async function reorderMedia(ids: string[]) {
  await requireAdmin()
  await saveOrder('portfolio_media', ids)
  refreshPublic()
}

export async function deleteMediaItem(id: string) {
  await requireAdmin()
  const { error } = await createServiceClient().from('portfolio_media').delete().eq('id', id)
  if (error) throw error
  refreshPublic()
}
