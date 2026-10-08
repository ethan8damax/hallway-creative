'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin'
import { CLIENT_STAGES, STAGE_LABELS, type ClientStage } from '@/lib/supabase/types'

const STAGES: readonly string[] = [...CLIENT_STAGES, 'archived']
const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim() || null

function refresh(id?: string) {
  revalidatePath('/admin', 'layout') // nav badge + Today
  revalidatePath('/admin/clients')
  if (id) revalidatePath(`/admin/clients/${id}`)
}

async function log(clientId: string, kind: 'note' | 'stage' | 'gallery', body: string) {
  const { error } = await createServiceClient().from('client_activity').insert({ client_id: clientId, kind, body })
  if (error) throw error
}

// Manual entry — for leads that arrive by phone, DM or in person.
export async function addClient(formData: FormData): Promise<void> {
  await requireAdmin()
  const name = text(formData, 'name')
  const email = text(formData, 'email')
  if (!name || !email) throw new Error('Name and email are required.')
  const { data, error } = await createServiceClient()
    .from('clients')
    .insert({ name, email, phone: text(formData, 'phone'), event_type: text(formData, 'event_type'), event_date: text(formData, 'event_date'), is_new: false })
    .select('id')
    .single()
  if (error) throw error
  await log(data.id, 'note', 'Added manually')
  refresh()
}

export async function updateClient(id: string, formData: FormData): Promise<void> {
  await requireAdmin()
  const name = text(formData, 'name')
  const email = text(formData, 'email')
  if (!name || !email) throw new Error('Name and email are required.')
  const { error } = await createServiceClient()
    .from('clients')
    .update({
      name,
      email,
      phone: text(formData, 'phone'),
      event_type: text(formData, 'event_type'),
      event_date: text(formData, 'event_date'),
      event_location: text(formData, 'event_location'),
      contract_url: text(formData, 'contract_url'),
      contract_signed_on: text(formData, 'contract_signed_on'),
    })
    .eq('id', id)
  if (error) throw error
  refresh(id)
}

export async function moveClient(id: string, stage: ClientStage): Promise<void> {
  await requireAdmin()
  if (!STAGES.includes(stage)) throw new Error('Unknown stage.')
  const db = createServiceClient()
  const { data: current, error: readError } = await db.from('clients').select('stage').eq('id', id).single()
  if (readError) throw readError
  if (current.stage === stage) return
  const { error } = await db.from('clients').update({ stage, stage_changed_at: new Date().toISOString(), is_new: false }).eq('id', id)
  if (error) throw error
  await log(id, 'stage', `Moved from ${STAGE_LABELS[current.stage as ClientStage]} to ${STAGE_LABELS[stage]}`)
  refresh(id)
}

export async function addNote(id: string, formData: FormData): Promise<void> {
  await requireAdmin()
  const body = text(formData, 'body')
  if (!body) throw new Error('Write a note first.')
  await log(id, 'note', body)
  refresh(id)
}

export async function deleteClient(id: string): Promise<void> {
  await requireAdmin()
  // galleries keep existing (client_id is set null), only the client record goes
  const { error } = await createServiceClient().from('clients').delete().eq('id', id)
  if (error) throw error
  refresh()
}
