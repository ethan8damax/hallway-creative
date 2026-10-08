import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyGalleryToken } from '@/lib/gallerySession'

// Records the client's first download. Only a holder of a valid unlock cookie
// can call it, so nobody else can mark someone's gallery as downloaded.
export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = createServiceClient()
  const { data: gallery } = await db.from('galleries').select('id, title, client_id, access_code_hash').eq('slug', slug).maybeSingle()
  if (!gallery) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const token = (await cookies()).get(`gallery_access_${slug}`)?.value
  if (!verifyGalleryToken(slug, gallery.access_code_hash, token)) {
    return NextResponse.json({ error: 'locked' }, { status: 401 })
  }

  const { data: marked } = await db
    .from('galleries')
    .update({ downloaded_at: new Date().toISOString() })
    .eq('id', gallery.id)
    .is('downloaded_at', null)
    .select('id')
  if (marked?.length && gallery.client_id) {
    await db.from('client_activity').insert({ client_id: gallery.client_id, kind: 'gallery', body: `Downloaded photos from “${gallery.title}”` })
  }
  return NextResponse.json({ ok: true })
}
