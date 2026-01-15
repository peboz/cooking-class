import { vi } from 'vitest';

/**
 * Mock authentication helpers for testing
 */

export const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'STUDENT' as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockAdminSession = {
  user: {
    id: 'admin-user-id',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN' as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockInstructorSession = {
  user: {
    id: 'instructor-user-id',
    name: 'Instructor User',
    email: 'instructor@example.com',
    role: 'INSTRUCTOR' as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockAuthFunction = (session: any) => {
  return vi.fn().mockResolvedValue(session);
};
