export function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ponytail: two titles that produce the same slug (e.g. "Family Portraits!"
// vs "Family Portraits?") hit a `slug unique` constraint — callers use this
// to turn that Postgres error into a plain message instead of a raw code.
export function isDuplicateSlugError(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}
