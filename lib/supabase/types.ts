export type Category = {
  id: string
  title: string
  slug: string
  description: string | null
  sort_order: number
  cover_url?: string | null
}

export type MediaItem = {
  id: string
  media_type: 'image' | 'video'
  image_url: string | null
  preview_url: string | null
  video_url: string | null
  caption: string | null
  width: number | null
  height: number | null
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
  client_id: string | null
  expires_on: string | null
  first_viewed_at: string | null
  downloaded_at: string | null
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

export const CLIENT_STAGES = ['inquiry', 'conversation', 'contract', 'event', 'red_room', 'posted'] as const
export type ClientStage = (typeof CLIENT_STAGES)[number] | 'archived'

export const STAGE_LABELS: Record<ClientStage, string> = {
  inquiry: 'Inquiry',
  conversation: 'Conversation',
  contract: 'Contract',
  event: 'Event',
  red_room: 'Red Room',
  posted: 'Posted',
  archived: 'Archived',
}

export type Client = {
  id: string
  name: string
  email: string
  phone: string | null
  event_type: string | null
  event_date: string | null
  event_location: string | null
  stage: ClientStage
  is_new: boolean
  inquiry_message: string | null
  contract_url: string | null
  contract_signed_on: string | null
  created_at: string
  stage_changed_at: string
}

export type ClientActivity = {
  id: string
  client_id: string
  kind: 'note' | 'stage' | 'inquiry' | 'gallery'
  body: string
  created_at: string
}
