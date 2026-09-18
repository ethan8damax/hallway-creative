import { NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createR2Client } from '@/lib/r2'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const { filename, contentType, prefix } = (await request.json()) as {
    filename: string
    contentType: string
    prefix: string
  }

  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'unsupported_content_type' }, { status: 400 })
  }

  const key = `${prefix}/${Date.now()}-${filename}`
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  })
  const uploadUrl = await getSignedUrl(createR2Client(), command, { expiresIn: 300 })
  // ponytail: encode each path segment individually — `key` legitimately
  // contains `/` as a path separator (from `prefix`), but filenames from
  // real photo exports (Finder/Photos) routinely contain spaces, parens,
  // and other characters that must be percent-encoded within a segment.
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key.split('/').map(encodeURIComponent).join('/')}`

  return NextResponse.json({ uploadUrl, key, publicUrl })
}
