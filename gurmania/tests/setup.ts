import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock Prisma Accelerate extension before anything else
vi.mock('@prisma/extension-accelerate', () => ({
  withAccelerate: () => ({
    $extends: (ext: any) => ext,
  }),
}));

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.AUTH_SECRET = 'test-secret-key-for-testing-only';
