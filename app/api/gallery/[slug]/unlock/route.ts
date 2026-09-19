import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyAccessCode } from '@/lib/accessCode'
import { signGalleryToken } from '@/lib/gallerySession'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { code } = (await request.json()) as { code: string }

  const { data: gallery, error } = await createServiceClient()
    .from('galleries')
    .select('id, access_code_hash')
    .eq('slug', slug)
    .single()

  if (error || !gallery) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const valid = await verifyAccessCode(code, gallery.access_code_hash)
  if (!valid) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(`gallery_access_${slug}`, signGalleryToken(slug), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: ONE_YEAR_SECONDS,
    path: `/gallery/${slug}`,
  })
  return response
}
