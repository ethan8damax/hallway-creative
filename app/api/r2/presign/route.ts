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

  const key = `${prefix}/${Date.now()}-${filename}`
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  })
  const uploadUrl = await getSignedUrl(createR2Client(), command, { expiresIn: 300 })
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  return NextResponse.json({ uploadUrl, key, publicUrl })
}
