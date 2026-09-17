'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function createCategory(title: string) {
  const { error } = await createServiceClient().from('categories').insert({ title, slug: slugify(title), sort_order: 0 })
  if (error) throw error
  revalidatePath('/portfolio')
  revalidatePath('/admin/portfolio')
}

export async function addMediaItem(
  categoryId: string,
  fields: { media_type: 'image' | 'video'; r2_key?: string; image_url?: string; preview_url?: string; video_url?: string; caption?: string }
) {
  const { error } = await createServiceClient()
    .from('portfolio_media')
    .insert({ category_id: categoryId, sort_order: 0, ...fields })
  if (error) throw error
  revalidatePath('/portfolio')
}

export async function deleteMediaItem(id: string) {
  const { error } = await createServiceClient().from('portfolio_media').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/portfolio')
}
