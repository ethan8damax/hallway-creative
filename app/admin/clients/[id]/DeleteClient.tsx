'use client'

import { useRouter } from 'next/navigation'
import { btn } from '@/components/admin/ui'
import { deleteClient } from '../actions'

export function DeleteClient({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  return (
    <button
      type="button"
      className={btn.danger}
      onClick={async () => {
        if (!window.confirm(`Delete ${name}? Their notes and history are removed. Their galleries stay.`)) return
        await deleteClient(id)
        router.push('/admin/clients')
      }}
    >
      Delete client
    </button>
  )
}
