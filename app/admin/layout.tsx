import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isAdminEmail } from '@/lib/admin'
import { AdminNav } from '@/components/admin/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data } = await (await createClient()).auth.getUser()

  // Signed out, this layout only ever wraps the login page (middleware redirects everything else).
  if (!isAdminEmail(data.user?.email)) {
    return <div className="min-h-screen bg-bg text-ink">{children}</div>
  }

  const { count } = await createServiceClient().from('clients').select('id', { count: 'exact', head: true }).eq('is_new', true)

  return (
    <div className="flex min-h-screen bg-bg text-ink">
      <AdminNav newInquiries={count ?? 0} />
      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-8 md:pb-12 md:pt-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
