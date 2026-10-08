import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyAccessCode } from '@/lib/accessCode'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!isAdminEmail(userData.user?.email)) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const { id } = await params
  const { code } = (await request.json().catch(() => ({}))) as { code?: string }
  const { data: gallery, error } = await createServiceClient()
    .from('galleries')
    .select('title, client_name, client_email, slug, access_code_hash, client_id')
    .eq('id', id)
    .single()

  if (error || !gallery) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // Codes are stored hashed, so Andrew re-enters the code to include it; checking
  // it against the hash means a typo can never reach the client.
  if (!code?.trim() || !(await verifyAccessCode(code.trim(), gallery.access_code_hash))) {
    return NextResponse.json({ error: 'wrong_code' }, { status: 400 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.CONTACT_FROM_EMAIL || 'HallWay Creative <onboarding@resend.dev>'
  const galleryUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/gallery/${gallery.slug}`

  try {
    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: gallery.client_email,
      subject: `Your photos from ${gallery.title} are ready`,
      text: [
        `Hi ${gallery.client_name},`,
        '',
        `Your gallery from ${gallery.title} is ready to view and download:`,
        '',
        galleryUrl,
        `Access code: ${code.trim()}`,
        '',
        'If you have any trouble getting in, just reply to this email.',
        '',
        'Andrew',
        'HallWay Creative',
      ].join('\n'),
    })
    // ponytail: the Resend SDK resolves (doesn't throw) on API-level errors
    // (e.g. domain not verified), so a thrown exception alone isn't enough —
    // matches the same guard in app/api/contact/route.ts.
    if (sendError) throw sendError

    const db = createServiceClient()
    await db.from('galleries').update({ sent_at: new Date().toISOString() }).eq('id', id)
    if (gallery.client_id) {
      await db.from('client_activity').insert({ client_id: gallery.client_id, kind: 'gallery', body: `Sent gallery “${gallery.title}” to ${gallery.client_email}` })
    }

    return NextResponse.json({ ok: true })
  } catch (sendError) {
    console.error('Failed to send gallery-ready email', sendError)
    return NextResponse.json({ error: 'send_failed' }, { status: 502 })
  }
}
