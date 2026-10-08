import { createClient } from '@/lib/supabase/server'
import { PageHeader, Panel } from '@/components/admin/ui'
import { ChangePassword } from './ChangePassword'

export default async function AccountPage() {
  const { data } = await (await createClient()).auth.getUser()
  return (
    <div className="max-w-2xl">
      <PageHeader title="Account" description={`Signed in as ${data.user?.email ?? ''}`} />
      <Panel title="Password" description="If you're still using the starter password, change it now.">
        <ChangePassword />
      </Panel>
    </div>
  )
}
