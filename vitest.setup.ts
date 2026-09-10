import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// ponytail: vitest.config has no `test.globals`, so RTL's auto-cleanup
// (which detects a global `afterEach`) never registers on its own.
afterEach(cleanup)
