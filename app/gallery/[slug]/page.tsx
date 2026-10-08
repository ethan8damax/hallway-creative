import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { verifyGalleryToken } from '@/lib/gallerySession'
import { isExpired } from '@/lib/galleryExpiry'
import { UnlockForm } from './UnlockForm'
import { GalleryView } from './GalleryView'
import type { Gallery, Photo } from '@/lib/supabase/types'

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: gallery } = await supabase.from('galleries').select('*').eq('slug', slug).maybeSingle<Gallery>()
  if (!gallery) notFound()

  // Andrew previews any gallery without the code, and his visits are never
  // counted as the client opening it.
  const { data: userData } = await (await createClient()).auth.getUser()
  const isAdmin = isAdminEmail(userData.user?.email)

  if (gallery.status === 'draft' && !isAdmin) notFound()

  if (isExpired(gallery.expires_on) && !isAdmin) {
    return (
      <section className="mx-auto flex min-h-[calc(100svh-12rem)] max-w-md flex-col justify-center px-5 py-24">
        <h1 className="text-balance font-display text-[clamp(2.25rem,6vw,3.5rem)] font-[340] leading-[1.02] tracking-[-0.02em] text-ink">
          {gallery.title}
        </h1>
        <p className="mt-4 text-pretty text-muted">
          This gallery has closed. If you still need your photos, get in touch with Andrew and he&apos;ll reopen it.
        </p>
        <a href="/contact" className="mt-10 w-fit rounded-xs bg-tally px-8 py-3.5 font-semibold text-on-accent transition-colors hover:bg-tally-deep">
          Contact Andrew
        </a>
      </section>
    )
  }

  const cookieStore = await cookies()
  const unlocked = isAdmin || verifyGalleryToken(slug, gallery.access_code_hash, cookieStore.get(`gallery_access_${slug}`)?.value)

  if (!unlocked) {
    return <UnlockForm slug={slug} title={gallery.title} />
  }

  if (!isAdmin && !gallery.first_viewed_at) {
    // `is null` guard keeps the first-view time from being overwritten by a race
    const { data: marked } = await supabase
      .from('galleries')
      .update({ first_viewed_at: new Date().toISOString() })
      .eq('id', gallery.id)
      .is('first_viewed_at', null)
      .select('id')
    if (marked?.length && gallery.client_id) {
      await supabase.from('client_activity').insert({ client_id: gallery.client_id, kind: 'gallery', body: `Opened their gallery “${gallery.title}”` })
    }
  }

  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('gallery_id', gallery.id)
    .order('sort_order', { ascending: true })

  return <GalleryView gallery={gallery} photos={(photos ?? []) as Photo[]} isPreview={isAdmin} />
}
