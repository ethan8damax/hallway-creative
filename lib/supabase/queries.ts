import { createServiceClient } from './service'
import type { Category, MediaItem, Service, About, SiteSettings } from './types'

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await createServiceClient()
    .from('categories')
    .select('*, portfolio_media(preview_url)')
    .order('sort_order', { ascending: true })
    .not('portfolio_media.preview_url', 'is', null)
    .order('sort_order', { referencedTable: 'portfolio_media', ascending: true })
    .limit(1, { referencedTable: 'portfolio_media' })
  if (error) throw error
  // ponytail: cover = first media item with a preview image, for the category tiles
  return (data ?? []).map(({ portfolio_media, ...category }) => ({
    ...category,
    cover_url: portfolio_media?.[0]?.preview_url ?? null,
  })) as Category[]
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

export type HeroPhoto = { url: string; caption: string | null; categoryTitle: string; categorySlug: string }

// Every landscape portfolio photo is a hero candidate; the caller picks one per request.
export async function getHeroCandidates(): Promise<HeroPhoto[]> {
  const { data, error } = await createServiceClient()
    .from('portfolio_media')
    .select('image_url, caption, width, height, categories(title, slug)')
    .eq('media_type', 'image')
    .not('image_url', 'is', null)
  if (error) throw error
  return (data ?? [])
    .filter((row) => !row.width || !row.height || row.width >= row.height)
    .map((row) => {
      const category = row.categories as unknown as { title: string; slug: string }
      return { url: row.image_url!, caption: row.caption, categoryTitle: category.title, categorySlug: category.slug }
    })
}

// A different frame leads the page on every request.
export async function getRandomHeroPhoto(): Promise<HeroPhoto | null> {
  const candidates = await getHeroCandidates()
  return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null
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
