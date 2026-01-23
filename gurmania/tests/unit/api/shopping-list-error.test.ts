/**
 * TEST 6: Shopping List Creation for Lesson Without Ingredients (Error Handling)
 * 
 * Ispitni slučaj: Kreiranje liste za kupovinu za lekciju bez sastojaka - izazivanje pogreške
 * API: POST /api/shopping-lists
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

import { POST } from '@/app/api/shopping-lists/route';
import { createMockPrisma } from '@/tests/helpers/db-helpers';
import { mockSession } from '@/tests/helpers/auth-helpers';
import { testLesson } from '@/tests/fixtures/test-data';

import { prisma } from '@/prisma';
import { auth } from '@/auth';

describe('Shopping List Creation - Error Handling', () => {
  beforeEach(() => {
    Object.assign(prisma, createMockPrisma());
    vi.clearAllMocks();
    (auth as any).mockResolvedValue(mockSession);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should reject shopping list creation for lesson without ingredients', async () => {
    // Ulazni podaci: lekcija bez sastojaka
    const requestBody = {
      lessonId: 'lesson-no-ingredients',
      title: 'My Shopping List',
    };

    // Mock: lesson exists but has no ingredients
    const lessonWithoutIngredients = {
      ...testLesson,
      id: requestBody.lessonId,
      ingredients: [], // Empty ingredients array
      module: {
        course: {
          title: 'Test Course',
        },
      },
    };

    (prisma.lesson.findUnique as any).mockResolvedValue(lessonWithoutIngredients);

    const request = new NextRequest('http://localhost:3000/api/shopping-lists', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Očekivani rezultat: greška 400
    expect(response.status).toBe(400);
    expect(data.error).toBe('Ova lekcija nema sastojaka');

    // Verify no shopping list was created
    expect(prisma.shoppingList.create).not.toHaveBeenCalled();
  });

  it('should create shopping list successfully for lesson with ingredients (regular case)', async () => {
    // Ulazni podaci: lekcija sa sastojcima
    const requestBody = {
      lessonId: 'lesson-with-ingredients',
      title: 'Ingredients for Pasta',
    };

    // Mock: lesson with ingredients
    const lessonWithIngredients = {
      ...testLesson,
      id: requestBody.lessonId,
      ingredients: [
        {
          id: 'li-1',
          ingredientId: 'ing-1',
          quantity: 500,
          unit: 'g',
          ingredient: {
            id: 'ing-1',
            name: 'Pasta',
            baseUnit: 'g',
            allergenFlags: [],
          },
        },
        {
          id: 'li-2',
          ingredientId: 'ing-2',
          quantity: 200,
          unit: 'ml',
          ingredient: {
            id: 'ing-2',
            name: 'Tomato Sauce',
            baseUnit: 'ml',
            allergenFlags: [],
          },
        },
      ],
      module: {
        course: {
          title: 'Italian Cooking',
        },
      },
    };

    (prisma.lesson.findUnique as any).mockResolvedValue(lessonWithIngredients);

    const baseShoppingList = {
      id: 'shopping-list-1',
      userId: mockSession.user.id,
      title: 'Moja kupovna lista',
      createdAt: new Date(),
      items: [],
    };

    (prisma.shoppingList.findFirst as any).mockResolvedValue(null);
    (prisma.shoppingList.create as any).mockResolvedValue(baseShoppingList);
    (prisma.shoppingListItem.findUnique as any).mockResolvedValue(null);
    (prisma.shoppingListItem.create as any).mockResolvedValue({});
    (prisma.shoppingList.update as any).mockResolvedValue({});

    const updatedShoppingList = {
      ...baseShoppingList,
      items: [
        {
          id: 'item-1',
          ingredientId: 'ing-1',
          quantity: 500,
          unit: 'g',
          purchased: false,
          ingredient: { id: 'ing-1', name: 'Pasta' },
        },
        {
          id: 'item-2',
          ingredientId: 'ing-2',
          quantity: 200,
          unit: 'ml',
          purchased: false,
          ingredient: { id: 'ing-2', name: 'Tomato Sauce' },
        },
      ],
    };

    (prisma.shoppingList.findUnique as any).mockResolvedValue(updatedShoppingList);

    const request = new NextRequest('http://localhost:3000/api/shopping-lists', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Očekivani rezultat: uspješno kreirana lista
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.shoppingList.id).toBe(updatedShoppingList.id);
    expect(data.shoppingList.items).toHaveLength(2);
    expect(prisma.shoppingList.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Moja kupovna lista',
        }),
      })
    );
  });

  it('should reject request without lessonId (boundary condition)', async () => {
    // Ulazni podaci: nedostaje lessonId
    const requestBody = {
      title: 'Shopping List',
    };

    const request = new NextRequest('http://localhost:3000/api/shopping-lists', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Očekivani rezultat: greška validacije
    expect(response.status).toBe(400);
    expect(data.error).toBe('Nedostaje lessonId parametar');
    expect(prisma.lesson.findUnique).not.toHaveBeenCalled();
  });

  it('should handle non-existent lesson (error handling)', async () => {
    // Ulazni podaci: nepostojeća lekcija
    const requestBody = {
      lessonId: 'non-existent-lesson',
      title: 'Shopping List',
    };

    // Mock: lesson not found
    (prisma.lesson.findUnique as any).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/shopping-lists', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Očekivani rezultat: greška 404
    expect(response.status).toBe(404);
    expect(data.error).toBe('Lekcija nije pronađena');
    expect(prisma.shoppingList.create).not.toHaveBeenCalled();
  });

  it('should use default title if not provided', async () => {
    // Ulazni podaci: bez naslova
    const requestBody = {
      lessonId: 'lesson-with-ingredients',
    };

    const lessonWithIngredients = {
      ...testLesson,
      title: 'Pasta Carbonara',
      ingredients: [
        {
          ingredientId: 'ing-1',
          quantity: 500,
          unit: 'g',
          ingredient: { id: 'ing-1', name: 'Pasta' },
        },
      ],
      module: {
        course: {
          title: 'Italian Basics',
        },
      },
    };

    (prisma.lesson.findUnique as any).mockResolvedValue(lessonWithIngredients);

    const baseShoppingList = {
      id: 'shopping-list-default',
      userId: mockSession.user.id,
      title: 'Moja kupovna lista',
      items: [],
      createdAt: new Date(),
    };

    (prisma.shoppingList.findFirst as any).mockResolvedValue(null);
    (prisma.shoppingList.create as any).mockResolvedValue(baseShoppingList);
    (prisma.shoppingListItem.findUnique as any).mockResolvedValue(null);
    (prisma.shoppingListItem.create as any).mockResolvedValue({});
    (prisma.shoppingList.update as any).mockResolvedValue({});
    (prisma.shoppingList.findUnique as any).mockResolvedValue(baseShoppingList);

    const request = new NextRequest('http://localhost:3000/api/shopping-lists', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Očekivani rezultat: koristi se master lista s default naslovom
    expect(response.status).toBe(200);
    expect(prisma.shoppingList.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Moja kupovna lista',
        }),
      })
    );
  });

  it('should reject unauthenticated request', async () => {
    // Setup: no session
    (auth as any).mockResolvedValue(null);

    // Ulazni podaci: neautentificirani korisnik
    const requestBody = {
      lessonId: 'lesson-1',
      title: 'My List',
    };

    const request = new NextRequest('http://localhost:3000/api/shopping-lists', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Očekivani rezultat: neautorizirano
    expect(response.status).toBe(401);
    expect(data.error).toBe('Neautorizirano');
    expect(prisma.shoppingList.create).not.toHaveBeenCalled();
  });
});
