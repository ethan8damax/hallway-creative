import Link from 'next/link'
import { getCategories } from '@/lib/supabase/queries'
import { createCategory } from './actions'

export default async function AdminPortfolioPage() {
  const categories = await getCategories()

  return (
    <div>
      <h2 className="font-display text-2xl">Portfolio categories</h2>
      <ul className="mt-6 flex flex-col gap-3">
        {categories.map((category) => (
          <li key={category.id}>
            <Link href={`/admin/portfolio/${category.id}`} className="text-ink hover:text-tally">
              {category.title}
            </Link>
          </li>
        ))}
      </ul>
      <form
        action={async (formData) => {
          'use server'
          await createCategory(formData.get('title') as string)
        }}
        className="mt-8 flex max-w-sm gap-3"
      >
        <input name="title" placeholder="New category title" required className="flex-1 border-b border-border bg-transparent py-2" />
        <button type="submit" className="rounded-xs bg-tally px-4 py-2 font-semibold text-on-accent">
          Add
        </button>
      </form>
    </div>
  )
}
