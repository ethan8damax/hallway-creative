import { getMediaItemsForCategory } from '@/lib/supabase/queries'
import { CategoryMediaEditor } from './CategoryMediaEditor'

export default async function CategoryMediaPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params
  const items = await getMediaItemsForCategory(categoryId)

  return <CategoryMediaEditor categoryId={categoryId} initialItems={items} />
}
