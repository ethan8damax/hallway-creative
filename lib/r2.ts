import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3'

export function createR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

// Turns a stored public URL back into its bucket key. Only URLs on our own
// public bucket qualify, so a stray external URL can never target a delete.
export function keyFromPublicUrl(url: string | null | undefined, base = process.env.R2_PUBLIC_URL): string | null {
  if (!url || !base || !url.startsWith(`${base}/`)) return null
  return url.slice(base.length + 1).split('/').map(decodeURIComponent).join('/')
}

// Best-effort: the database row is already gone when this runs, and an orphaned
// file is harmless, so failures are logged rather than surfaced to Andrew.
export async function deleteR2Objects(keys: (string | null | undefined)[]) {
  const unique = [...new Set(keys.filter((k): k is string => !!k))]
  for (let i = 0; i < unique.length; i += 1000) {
    try {
      const { Errors } = await createR2Client().send(
        new DeleteObjectsCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Delete: { Objects: unique.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true },
        })
      )
      if (Errors?.length) console.error('Some R2 deletes failed', Errors)
    } catch (error) {
      console.error('R2 delete failed', error)
    }
  }
}
