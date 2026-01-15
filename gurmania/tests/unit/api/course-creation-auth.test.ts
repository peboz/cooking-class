/**
 * TEST 5: Course Creation Without Instructor Role (Error Handling)
 * 
 * Ispitni slučaj: Kreiranje tečaja bez odgovarajuće uloge - izazivanje pogreške
 * API: POST /api/instructor/courses
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock modules BEFORE importing
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

import { POST } from '@/app/api/instructor/courses/route';
import { createMockPrisma } from '@/tests/helpers/db-helpers';
import { mockSession, mockInstructorSession } from '@/tests/helpers/auth-helpers';

import { prisma } from '@/prisma';
import { auth } from '@/auth';

describe('Course Creation Authorization - Error Handling', () => {
  beforeEach(() => {
    Object.assign(prisma, createMockPrisma());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should reject course creation by regular student (error handling)', async () => {
    // Setup student session
    (auth as any).mockResolvedValue(mockSession);

    // Ulazni podaci: student pokušava kreirati tečaj
    const requestBody = {
      title: 'My Cooking Course',
      description: 'A course description',
      difficulty: 'EASY',
      cuisineType: 'Italian',
      tags: ['pasta', 'italian'],
    };

    const request = new NextRequest('http://localhost:3000/api/instructor/courses', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Očekivani rezultat: zabranjen pristup (403)
    expect(response.status).toBe(403);
    expect(data.error).toBe('Nemate ovlasti za kreiranje tečaja');

    // Verify no course was created
    expect(prisma.course.create).not.toHaveBeenCalled();
  });

  it('should allow course creation by instructor (regular case)', async () => {
    // Setup instructor session
    (auth as any).mockResolvedValue(mockInstructorSession);

    // Ulazni podaci: instruktor kreira tečaj
    const requestBody = {
      title: 'Italian Cooking Basics',
      description: 'Learn Italian cooking',
      difficulty: 'EASY',
      cuisineType: 'Italian',
      tags: ['pasta', 'italian'],
    };

    // Mock course creation
    const createdCourse = {
      id: 'course-123',
      instructorId: mockInstructorSession.user.id,
      ...requestBody,
      published: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.course.create as any).mockResolvedValue(createdCourse);
    (prisma.auditLog.create as any).mockResolvedValue({ id: 'audit-1' });

    const request = new NextRequest('http://localhost:3000/api/instructor/courses', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Očekivani rezultat: uspješno kreiran tečaj
    expect(response.status).toBe(201);
    expect(data.message).toBe('Tečaj uspješno kreiran');
    expect(data.course.id).toBe(createdCourse.id);
    expect(prisma.course.create).toHaveBeenCalled();
  });

  it('should reject course creation without authentication', async () => {
    // Setup: no session (unauthenticated)
    (auth as any).mockResolvedValue(null);

    // Ulazni podaci: neautentificirani korisnik
    const requestBody = {
      title: 'Unauthorized Course',
      description: 'This should fail',
    };

    const request = new NextRequest('http://localhost:3000/api/instructor/courses', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Očekivani rezultat: neautorizirano (401)
    expect(response.status).toBe(401);
    expect(data.error).toBe('Neautorizirano');
    expect(prisma.course.create).not.toHaveBeenCalled();
  });

  it('should validate required title field (boundary condition)', async () => {
    (auth as any).mockResolvedValue(mockInstructorSession);

    // Test empty title
    const emptyTitleRequest = {
      title: '',
      description: 'Some description',
    };

    let request = new NextRequest('http://localhost:3000/api/instructor/courses', {
      method: 'POST',
      body: JSON.stringify(emptyTitleRequest),
    });

    let response = await POST(request);
    let data = await response.json();

    // Očekivani rezultat: greška validacije
    expect(response.status).toBe(400);
    expect(data.error).toBe('Naziv tečaja je obavezan');

    // Test missing title
    const missingTitleRequest = {
      description: 'Some description',
    };

    request = new NextRequest('http://localhost:3000/api/instructor/courses', {
      method: 'POST',
      body: JSON.stringify(missingTitleRequest),
    });

    response = await POST(request);
    data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Naziv tečaja je obavezan');
  });

  it('should validate title length (boundary condition)', async () => {
    (auth as any).mockResolvedValue(mockInstructorSession);

    // Ulazni podaci: naziv duži od 200 znakova
    const longTitle = 'A'.repeat(201);
    const requestBody = {
      title: longTitle,
      description: 'Description',
    };

    const request = new NextRequest('http://localhost:3000/api/instructor/courses', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Očekivani rezultat: greška validacije
    expect(response.status).toBe(400);
    expect(data.error).toBe('Naziv tečaja može imati maksimalno 200 znakova');
    expect(prisma.course.create).not.toHaveBeenCalled();
  });

  it('should accept title with exactly 200 characters (boundary)', async () => {
    (auth as any).mockResolvedValue(mockInstructorSession);

    // Ulazni podaci: naziv točno 200 znakova
    const exactTitle = 'A'.repeat(200);
    const requestBody = {
      title: exactTitle,
      description: 'Description',
    };

    (prisma.course.create as any).mockResolvedValue({
      id: 'course-boundary',
      instructorId: mockInstructorSession.user.id,
      title: exactTitle,
      published: false,
    });
    (prisma.auditLog.create as any).mockResolvedValue({ id: 'audit-boundary' });

    const request = new NextRequest('http://localhost:3000/api/instructor/courses', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);

    // Očekivani rezultat: uspješno kreiran
    expect(response.status).toBe(201);
    expect(prisma.course.create).toHaveBeenCalled();
  });
});
