import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { verifyGalleryToken } from '@/lib/gallerySession'
import { UnlockForm } from './UnlockForm'
import { GalleryView } from './GalleryView'
import type { Gallery, Photo } from '@/lib/supabase/types'

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: gallery } = await supabase.from('galleries').select('*').eq('slug', slug).maybeSingle<Gallery>()
  if (!gallery) notFound()

  if (gallery.status === 'draft') {
    const adminClient = await createClient()
    const { data: userData } = await adminClient.auth.getUser()
    if (!userData.user) notFound()
  }

  const cookieStore = await cookies()
  const unlocked = verifyGalleryToken(slug, cookieStore.get(`gallery_access_${slug}`)?.value)

  if (!unlocked) {
    return <UnlockForm slug={slug} />
  }

  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('gallery_id', gallery.id)
    .order('sort_order', { ascending: true })

  return <GalleryView title={gallery.title} photos={(photos ?? []) as Photo[]} />
}
