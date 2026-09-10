export type Category = {
  _id: string
  title: string
  slug: string
  description?: string
  order: number
}

export type MediaItem = {
  _id: string
  mediaType: 'image' | 'video'
  image?: unknown
  videoUrl?: string
  caption?: string
  order: number
}

export type Service = {
  _id: string
  title: string
  description: string
  order: number
}

export type About = {
  bio: string
  portrait?: unknown
}

export type SiteSettings = {
  heroHeadline: string
  heroSubtext?: string
  contactEmail: string
  instagramUrl?: string
}
