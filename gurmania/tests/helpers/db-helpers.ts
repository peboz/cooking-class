import { PrismaClient } from '@/app/generated/prisma/client';
import { vi } from 'vitest';

/**
 * Mock Prisma client for testing
 * Use this in your tests to mock database operations
 */
export const createMockPrisma = () => {
  return {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    course: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    progress: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    comment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    instructorProfile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    shoppingList: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    lesson: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    module: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    emailVerificationToken: {
      create: vi.fn(),
    },
    account: {
      findMany: vi.fn(),
    },
  } as any;
};

/**
 * Reset all mocks in Prisma client
 */
export const resetMockPrisma = (mockPrisma: any) => {
  Object.values(mockPrisma).forEach((model: any) => {
    Object.values(model).forEach((method: any) => {
      if (typeof method.mockReset === 'function') {
        method.mockReset();
      }
    });
  });
};
