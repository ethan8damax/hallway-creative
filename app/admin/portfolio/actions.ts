'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { slugify, isDuplicateSlugError } from '@/lib/slugify'
import type { MediaItem } from '@/lib/supabase/types'

export async function createCategory(title: string) {
  const { error } = await createServiceClient().from('categories').insert({ title, slug: slugify(title), sort_order: 0 })
  if (error) {
    if (isDuplicateSlugError(error)) {
      throw new Error('A category with that name already exists.')
    }
    throw error
  }
  revalidatePath('/portfolio')
  revalidatePath('/admin/portfolio')
}

export async function addMediaItem(
  categoryId: string,
  fields: { media_type: 'image' | 'video'; r2_key?: string; image_url?: string; preview_url?: string; video_url?: string; caption?: string }
): Promise<MediaItem> {
  const { data, error } = await createServiceClient()
    .from('portfolio_media')
    .insert({ category_id: categoryId, sort_order: 0, ...fields })
    .select()
    .single()
  if (error) throw error
  revalidatePath('/portfolio')
  return data as MediaItem
}

export async function deleteMediaItem(id: string) {
  const { error } = await createServiceClient().from('portfolio_media').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/portfolio')
}
