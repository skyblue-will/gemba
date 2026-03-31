import { vi } from 'vitest'

// Set test env vars
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.GEMBA_API_KEY = 'test-key'
