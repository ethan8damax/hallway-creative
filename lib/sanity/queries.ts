import { sanityClient } from './client'
import type { Category, MediaItem, Service, About, SiteSettings } from './types'

export async function getCategories(): Promise<Category[]> {
  return sanityClient.fetch(
    `*[_type == "category"] | order(order asc) { _id, title, "slug": slug.current, description, order }`
  )
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return sanityClient.fetch(
    `*[_type == "category" && slug.current == $slug][0] { _id, title, "slug": slug.current, description, order }`,
    { slug }
  )
}

export async function getMediaItemsForCategory(categoryId: string): Promise<MediaItem[]> {
  return sanityClient.fetch(
    `*[_type == "mediaItem" && category._ref == $categoryId] | order(order asc) { _id, mediaType, image, videoUrl, caption, order }`,
    { categoryId }
  )
}

export async function getServices(): Promise<Service[]> {
  return sanityClient.fetch(`*[_type == "service"] | order(order asc) { _id, title, description, order }`)
}

export async function getAbout(): Promise<About | null> {
  return sanityClient.fetch(`*[_type == "about"][0] { bio, portrait }`)
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return sanityClient.fetch(`*[_type == "siteSettings"][0] { heroHeadline, heroSubtext, contactEmail, instagramUrl }`)
}
