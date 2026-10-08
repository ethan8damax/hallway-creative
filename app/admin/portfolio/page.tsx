import { createServiceClient } from '@/lib/supabase/service'
import { getCategories } from '@/lib/supabase/queries'
import { ActionForm } from '@/components/admin/ActionForm'
import { EmptyState, Field, PageHeader, Panel, inputClass } from '@/components/admin/ui'
import { CategoryList } from './CategoryList'
import { createCategory } from './actions'

export default async function AdminPortfolioPage() {
  const [categories, { data: counts }] = await Promise.all([
    getCategories(),
    createServiceClient().from('categories').select('id, portfolio_media(count)'),
  ])
  const countById = new Map((counts ?? []).map((c) => [c.id, (c.portfolio_media as unknown as { count: number }[])[0]?.count ?? 0]))

  return (
    <div className="max-w-3xl">
      <PageHeader title="Portfolio" description="The categories on your public portfolio. The order here is the order on the site." />
      {categories.length > 0 ? (
        <CategoryList initial={categories.map((c) => ({ id: c.id, title: c.title, slug: c.slug, cover_url: c.cover_url, count: countById.get(c.id) ?? 0 }))} />
      ) : (
        <EmptyState title="No categories yet">Add your first one below, e.g. Weddings.</EmptyState>
      )}
      <Panel title="Add a category" className="mt-8">
        <ActionForm action={createCategory} submitLabel="Add category" resetOnSuccess>
          <Field label="Name">
            <input name="title" required placeholder="e.g. Portraits" className={inputClass} />
          </Field>
          <Field label="One-line description" hint="Shown under the title on the site.">
            <input name="description" className={inputClass} />
          </Field>
        </ActionForm>
      </Panel>
    </div>
  )
}
