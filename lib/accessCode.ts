import bcrypt from 'bcryptjs'

export async function hashAccessCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10)
}

export async function verifyAccessCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash)
}
