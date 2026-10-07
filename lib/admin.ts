import { createClient } from '@/lib/supabase/server'

// ponytail: hardcoded allowlist — move to an env var or an admins table if the team grows
const ADMIN_EMAILS = ['hallway.ah@gmail.com', 'ethandouglasmaxey@gmail.com']

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}

// Server actions are public POST endpoints regardless of which page renders them,
// so each one must check this itself — middleware only guards page navigation.
export async function requireAdmin() {
  const { data } = await (await createClient()).auth.getUser()
  if (!isAdminEmail(data.user?.email)) throw new Error('unauthorized')
}
