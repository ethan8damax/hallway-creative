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
    env: {
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
      NEXT_PUBLIC_SANITY_DATASET: 'test',
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
