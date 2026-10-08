import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/admin', () => ({ requireAdmin: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
const { deleteR2Objects } = vi.hoisted(() => ({ deleteR2Objects: vi.fn() }))
vi.mock('@/lib/r2', async (orig) => ({ ...(await orig<typeof import('@/lib/r2')>()), deleteR2Objects }))
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: () => ({
      delete: () => ({
        eq: () => ({
          eq: () => ({
            select: async () => ({
              data: [{ r2_key: 'galleries/sunset/1-IMG_1.jpg', preview_url: 'https://pub-abc.r2.dev/galleries/sunset/2-preview-IMG_1.jpg' }],
              error: null,
            }),
          }),
        }),
      }),
    }),
  }),
}))

import { deletePhoto } from './actions'

describe('deletePhoto', () => {
  it('removes both the original and the preview file from storage', async () => {
    vi.stubEnv('R2_PUBLIC_URL', 'https://pub-abc.r2.dev')
    await deletePhoto('p1', 'g1')
    expect(deleteR2Objects).toHaveBeenCalledWith(['galleries/sunset/1-IMG_1.jpg', 'galleries/sunset/2-preview-IMG_1.jpg'])
  })
})
