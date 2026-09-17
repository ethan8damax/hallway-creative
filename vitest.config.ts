import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // ponytail: defense-in-depth alongside .gitignore — a nested Claude Code
    // worktree under .claude/worktrees/ would otherwise get globbed too.
    // Vitest's own defaults are repeated here since setting `exclude`
    // replaces them rather than extending them.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/.claude/**',
    ],
    // ponytail: automocking '@/lib/sanity/queries' (e.g. in page tests) imports the
    // real module first to derive its shape, which constructs sanityClient — give it
    // a dummy projectId so that doesn't throw. Not real Sanity config.
    // The Sanity vars stay here (deliberately, not per the migration plan's literal
    // Step 5 text) until a later task rewires those page tests off Sanity — dropping
    // them now breaks every test that automocks lib/sanity/queries.
    env: {
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
      NEXT_PUBLIC_SANITY_DATASET: 'test',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
