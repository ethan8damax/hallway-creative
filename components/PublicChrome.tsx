'use client'

import { usePathname } from 'next/navigation'

// The public header/footer belong to the marketing site; /admin has its own shell.
export function PublicChrome({ children }: { children: React.ReactNode }) {
  return usePathname().startsWith('/admin') ? null : <>{children}</>
}
