'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin'
import type { SiteSettings, About } from '@/lib/supabase/types'

export async function updateSiteSettings(id: string, fields: Omit<SiteSettings, 'id'>) {
  await requireAdmin()
  const { error } = await createServiceClient().from('site_settings').update(fields).eq('id', id)
  if (error) throw error
  revalidatePath('/')
  revalidatePath('/admin/content')
}

export async function updateAbout(id: string, fields: Omit<About, 'id'>) {
  await requireAdmin()
  const { error } = await createServiceClient().from('about').update(fields).eq('id', id)
  if (error) throw error
  revalidatePath('/about')
  revalidatePath('/admin/content')
}
