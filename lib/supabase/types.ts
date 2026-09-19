export type Category = {
  id: string
  title: string
  slug: string
  description: string | null
  sort_order: number
}

export type MediaItem = {
  id: string
  media_type: 'image' | 'video'
  image_url: string | null
  preview_url: string | null
  video_url: string | null
  caption: string | null
  sort_order: number
}

export type Service = {
  id: string
  title: string
  description: string
  category_id: string | null
  sort_order: number
}

export type About = {
  id: string
  bio: string | null
  portrait_url: string | null
}

export type SiteSettings = {
  id: string
  hero_headline: string | null
  hero_subtext: string | null
  contact_email: string | null
  instagram_url: string | null
}

export type Gallery = {
  id: string
  title: string
  client_name: string
  client_email: string
  slug: string
  event_date: string | null
  access_code_hash: string
  status: 'draft' | 'published'
  sent_at: string | null
  created_at: string
}

export type Photo = {
  id: string
  gallery_id: string
  r2_key: string
  url: string
  preview_url: string
  width: number | null
  height: number | null
  filename: string | null
  sort_order: number
  created_at: string
}
