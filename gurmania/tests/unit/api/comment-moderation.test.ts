/**
 * TEST 4: Comment Moderation by Admin (Regular Case & Boundary Conditions)
 * 
 * Ispitni slučaj: Odobravanje/odbijanje komentara od strane admina - redovni slučaj i rubni uvjeti
 * API: PATCH /api/admin/comments/[commentId]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock modules BEFORE importing anything that uses them
vi.mock('@/prisma', () => ({
  prisma: {
    user: {},
    course: {},
    progress: {},
    comment: {},
    instructorProfile: {},
    shoppingList: {},
    lesson: {},
    module: {},
    auditLog: {},
    emailVerificationToken: {},
    account: {},
  }
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

import { PATCH } from '@/app/api/admin/comments/[commentId]/route';
import { createMockPrisma } from '@/tests/helpers/db-helpers';
import { mockAdminSession, mockSession } from '@/tests/helpers/auth-helpers';
import { testComment } from '@/tests/fixtures/test-data';

import { prisma } from '@/prisma';
import { auth } from '@/auth';

describe('Comment Moderation - Admin Actions', () => {
  beforeEach(() => {
    // Setup mocks for each test
    Object.assign(prisma, createMockPrisma());
    vi.restoreAllMocks();
  });

  it('should approve comment successfully (regular case)', async () => {
    // Setup admin session
    (auth as any).mockResolvedValue(mockAdminSession);

    // Ulazni podaci: approve comment
    const commentId = 'comment-123';
    const requestBody = {
      status: 'APPROVED',
    };

    // Mock: find comment
    (prisma.comment.findUnique as any).mockResolvedValue(testComment);

    // Mock: update comment
    const updatedComment = {
      ...testComment,
      status: 'APPROVED',
      user: { id: 'student-1', name: 'Student', email: 'student@test.com', image: null },
      lesson: { id: 'lesson-1', title: 'Test Lesson' },
    };
    (prisma.comment.update as any).mockResolvedValue(updatedComment);

    // Mock: audit log creation
    (prisma.auditLog.create as any).mockResolvedValue({
      id: 'audit-1',
      userId: mockAdminSession.user.id,
      action: 'COMMENT_APPROVED',
    });

    const request = new NextRequest(
      `http://localhost:3000/api/admin/comments/${commentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ commentId }),
    });
    const data = await response.json();

    // Očekivani rezultat: uspješno odobrenje
    expect(response.status).toBe(200);
    expect(data.comment.status).toBe('APPROVED');

    // Verify database operations
    expect(prisma.comment.update).toHaveBeenCalledWith({
      where: { id: commentId },
      data: { status: 'APPROVED' },
      include: expect.any(Object),
    });

    // Verify audit log was created
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: mockAdminSession.user.id,
        action: 'COMMENT_APPROVED',
        entityType: 'Comment',
        entityId: commentId,
        metadata: expect.objectContaining({
          status: 'APPROVED',
        }),
      },
    });
  });

  it('should reject comment successfully', async () => {
    (auth as any).mockResolvedValue(mockAdminSession);

    // Ulazni podaci: reject comment
    const commentId = 'comment-456';
    const requestBody = {
      status: 'REJECTED',
    };

    (prisma.comment.findUnique as any).mockResolvedValue(testComment);

    const updatedComment = {
      ...testComment,
      status: 'REJECTED',
      user: { id: 'student-1', name: 'Student', email: 'student@test.com', image: null },
      lesson: { id: 'lesson-1', title: 'Test Lesson' },
    };
    (prisma.comment.update as any).mockResolvedValue(updatedComment);
    (prisma.auditLog.create as any).mockResolvedValue({ id: 'audit-2' });

    const request = new NextRequest(
      `http://localhost:3000/api/admin/comments/${commentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ commentId }),
    });
    const data = await response.json();

    // Očekivani rezultat: odbijen komentar
    expect(response.status).toBe(200);
    expect(data.comment.status).toBe('REJECTED');
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'COMMENT_REJECTED',
      }),
    });
  });

  it('should reject invalid status value (boundary condition)', async () => {
    (auth as any).mockResolvedValue(mockAdminSession);

    // Ulazni podaci: nevažeći status
    const commentId = 'comment-789';
    const invalidStatuses = ['INVALID', 'approved', 'pending', 'DELETED', 123, null];

    for (const invalidStatus of invalidStatuses) {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/comments/${commentId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: invalidStatus }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ commentId }),
      });
      const data = await response.json();

      // Očekivani rezultat: greška 400
      expect(response.status).toBe(400);
      expect(data.error).toBe('Nevažeći status');
    }
  });

  it('should reject non-admin user (authorization check)', async () => {
    // Setup regular user session
    (auth as any).mockResolvedValue(mockSession);

    // Ulazni podaci: običan korisnik pokušava moderirati
    const commentId = 'comment-999';
    const requestBody = {
      status: 'APPROVED',
    };

    const request = new NextRequest(
      `http://localhost:3000/api/admin/comments/${commentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ commentId }),
    });
    const data = await response.json();

    // Očekivani rezultat: zabranjen pristup
    expect(response.status).toBe(403);
    expect(data.error).toBe('Nemate dozvolu pristupa');

    // Verify no database operations were performed
    expect(prisma.comment.update).not.toHaveBeenCalled();
  });

  it('should handle non-existent comment (error handling)', async () => {
    (auth as any).mockResolvedValue(mockAdminSession);

    // Ulazni podaci: nepostojeći komentar
    const commentId = 'non-existent-comment';
    const requestBody = {
      status: 'APPROVED',
    };

    // Mock: comment not found
    (prisma.comment.findUnique as any).mockResolvedValue(null);

    const request = new NextRequest(
      `http://localhost:3000/api/admin/comments/${commentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ commentId }),
    });
    const data = await response.json();

    // Očekivani rezultat: greška 404
    expect(response.status).toBe(404);
    expect(data.error).toBe('Komentar nije pronađen');

    // Verify update was not attempted
    expect(prisma.comment.update).not.toHaveBeenCalled();
  });
});
