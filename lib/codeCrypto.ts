import crypto from 'crypto'

// Access codes are verified against a bcrypt hash (lib/accessCode.ts), which
// can't be reversed. To *show* Andrew the current code, a second copy is kept
// encrypted (AES-256-GCM) with a key derived from the server-only session
// secret — a database leak alone doesn't reveal any codes.
function key(): Buffer {
  const secret = process.env.GALLERY_SESSION_SECRET
  if (!secret) throw new Error('GALLERY_SESSION_SECRET is not set')
  return crypto.createHash('sha256').update(`${secret}:access-code`).digest()
}

export function encryptCode(code: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const data = Buffer.concat([cipher.update(code, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64')
}

// null when missing or unreadable (e.g. galleries created before codes were stored)
export function decryptCode(blob: string | null | undefined): string | null {
  if (!blob) return null
  try {
    const raw = Buffer.from(blob, 'base64')
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12))
    decipher.setAuthTag(raw.subarray(12, 28))
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}
