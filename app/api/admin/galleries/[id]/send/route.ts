import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const { id } = await params
  const { data: gallery, error } = await createServiceClient()
    .from('galleries')
    .select('title, client_name, client_email, slug')
    .eq('id', id)
    .single()

  if (error || !gallery) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.CONTACT_FROM_EMAIL || 'HallWay Creative <onboarding@resend.dev>'
  const galleryUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/gallery/${gallery.slug}`

  try {
    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: gallery.client_email,
      subject: `Your photos from ${gallery.title} are ready`,
      text: `Hi ${gallery.client_name},\n\nYour gallery from ${gallery.title} is ready to view and download:\n\n${galleryUrl}\n\nIf you have any trouble accessing it, just reply to this email.`,
    })
    // ponytail: the Resend SDK resolves (doesn't throw) on API-level errors
    // (e.g. domain not verified), so a thrown exception alone isn't enough —
    // matches the same guard in app/api/contact/route.ts.
    if (sendError) throw sendError

    await createServiceClient().from('galleries').update({ sent_at: new Date().toISOString() }).eq('id', id)

    return NextResponse.json({ ok: true })
  } catch (sendError) {
    console.error('Failed to send gallery-ready email', sendError)
    return NextResponse.json({ error: 'send_failed' }, { status: 502 })
  }
}
