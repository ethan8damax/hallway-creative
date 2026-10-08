import { createServiceClient } from '@/lib/supabase/service'

// Writes sort_order = position for each id. Server-only; callers check admin.
// ponytail: one UPDATE per row (fine into the hundreds); move to a single
// SQL function if galleries routinely run into the thousands.
export async function saveOrder(table: 'photos' | 'portfolio_media' | 'categories' | 'services', ids: string[]) {
  const db = createServiceClient()
  for (let i = 0; i < ids.length; i += 25) {
    const results = await Promise.all(
      ids.slice(i, i + 25).map((id, j) => db.from(table).update({ sort_order: i + j }).eq('id', id))
    )
    const failed = results.find((r) => r.error)
    if (failed) throw failed.error
  }
}
