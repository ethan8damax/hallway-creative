import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // ponytail: automocking '@/lib/sanity/queries' (e.g. in page tests) imports the
    // real module first to derive its shape, which constructs sanityClient — give it
    // a dummy projectId so that doesn't throw. Not real Sanity config.
    env: {
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
      NEXT_PUBLIC_SANITY_DATASET: 'test',
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
