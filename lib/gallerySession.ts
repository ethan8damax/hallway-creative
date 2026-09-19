import crypto from 'crypto'

// ponytail: the unlock cookie used to just be the literal string 'unlocked'
// — that's forgeable by anyone who can send a raw HTTP request with a
// guessed/known slug (a gallery slug is the public, shareable part of the
// URL; httpOnly only stops a *browser's own JS* from reading/writing it,
// it does nothing against a hand-crafted request). Signing the cookie's
// value with a server-only secret means it can't be produced without
// actually passing the access-code check in the unlock route.
function getSecret(): string {
  const secret = process.env.GALLERY_SESSION_SECRET
  if (!secret) throw new Error('GALLERY_SESSION_SECRET is not set')
  return secret
}

export function signGalleryToken(slug: string): string {
  return crypto.createHmac('sha256', getSecret()).update(slug).digest('hex')
}

export function verifyGalleryToken(slug: string, token: string | undefined | null): boolean {
  if (!token) return false
  const expected = signGalleryToken(slug)
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
