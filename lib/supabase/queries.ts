import { createServiceClient } from './service'
import type { Category, MediaItem, Service, About, SiteSettings } from './types'

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await createServiceClient()
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Category[]
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await createServiceClient()
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data as Category | null
}

export async function getMediaItemsForCategory(categoryId: string): Promise<MediaItem[]> {
  const { data, error } = await createServiceClient()
    .from('portfolio_media')
    .select('*')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as MediaItem[]
}

export async function getServices(): Promise<Service[]> {
  const { data, error } = await createServiceClient()
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Service[]
}

export async function getAbout(): Promise<About | null> {
  const { data, error } = await createServiceClient().from('about').select('*').limit(1).maybeSingle()
  if (error) throw error
  return data as About | null
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const { data, error } = await createServiceClient().from('site_settings').select('*').limit(1).maybeSingle()
  if (error) throw error
  return data as SiteSettings | null
}
