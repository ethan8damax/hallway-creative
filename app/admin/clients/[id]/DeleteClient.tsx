'use client'

import { useRouter } from 'next/navigation'
import { btn } from '@/components/admin/ui'
import { deleteClient } from '../actions'
import { useConfirm } from '@/components/admin/ConfirmDialog'

export function DeleteClient({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const confirm = useConfirm()
  return (
    <button
      type="button"
      className={btn.danger}
      onClick={async () => {
        const ok = await confirm({
          title: `Delete ${name}?`,
          body: 'Their details, notes and history are permanently removed. Any galleries you made for them stay.',
          confirmLabel: 'Delete client',
        })
        if (!ok) return
        await deleteClient(id)
        router.push('/admin/clients')
      }}
    >
      Delete client
    </button>
  )
}
