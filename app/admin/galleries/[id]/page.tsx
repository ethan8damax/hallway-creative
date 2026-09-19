import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { GalleryEditor } from './GalleryEditor'
import type { Gallery, Photo } from '@/lib/supabase/types'

export default async function GalleryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const [{ data: gallery }, { data: photos }] = await Promise.all([
    supabase.from('galleries').select('*').eq('id', id).maybeSingle(),
    supabase.from('photos').select('*').eq('gallery_id', id).order('sort_order', { ascending: true }),
  ])

  if (!gallery) notFound()

  return <GalleryEditor gallery={gallery as Gallery} initialPhotos={(photos ?? []) as Photo[]} />
}
