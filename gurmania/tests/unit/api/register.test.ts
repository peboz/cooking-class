/**
 * TEST 1: User Registration (Regular Case)
 * 
 * Ispitni slučaj: Dodavanje novog polaznika u sustav - redovni slučaj
 * API: POST /api/auth/register
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { POST } from '@/app/api/auth/register/route';
import { createMockPrisma } from '@/tests/helpers/db-helpers';

// Mock dependencies BEFORE importing
vi.mock('@/prisma');
vi.mock('bcryptjs');
vi.mock('@/lib/tokens');
vi.mock('@/lib/email');

import { prisma } from '@/prisma';
import { generateVerificationToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/email';

describe('User Registration API - Regular Case', () => {
  beforeEach(() => {
    Object.assign(prisma, createMockPrisma());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully register a new user with valid credentials', async () => {
    // Ulazni podaci
    const requestBody = {
      email: 'newuser@fer.hr',
      password: 'StrongPass123!',
      name: 'New User',
      termsAccepted: true,
    };

    // Mock database response - user doesn't exist
    (prisma.user.findUnique as any).mockResolvedValue(null);

    // Mock password hashing
    const hashedPassword = '$2a$10$hashedpassword123';
    (bcrypt.hash as any).mockResolvedValue(hashedPassword);

    // Mock user creation
    const createdUser = {
      id: 'new-user-id',
      email: requestBody.email,
      name: requestBody.name,
      password: hashedPassword,
      emailVerified: null,
      role: 'STUDENT',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.user.create as any).mockResolvedValue(createdUser);

    // Mock token generation
    const verificationToken = 'verification-token-123';
    (generateVerificationToken as any).mockResolvedValue(verificationToken);
    (sendVerificationEmail as any).mockResolvedValue(true);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Execute
    const response = await POST(request);
    const data = await response.json();

    // Očekivani rezultati
    expect(response.status).toBe(201);
    expect(data.message).toContain('Registracija uspješna');
    expect(data.userId).toBe(createdUser.id);

    // Verify password was hashed
    expect(bcrypt.hash).toHaveBeenCalledWith(requestBody.password, 10);

    // Verify user was created with hashed password
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: requestBody.email,
        name: requestBody.name,
        password: hashedPassword,
      },
    });

    // Verify verification email was sent
    expect(generateVerificationToken).toHaveBeenCalledWith(requestBody.email);
    expect(sendVerificationEmail).toHaveBeenCalledWith(requestBody.email, verificationToken);
  });

  it('should validate required fields', async () => {
    // Test missing fields
    const invalidRequests = [
      { email: 'test@test.com', password: 'pass', termsAccepted: true }, // missing name
      { email: 'test@test.com', name: 'Test', termsAccepted: true }, // missing password
      { password: 'pass', name: 'Test', termsAccepted: true }, // missing email
    ];

    for (const body of invalidRequests) {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Nedostaju obavezna polja');
    }
  });

  it('should reject registration without accepting terms', async () => {
    // Ulazni podaci bez prihvaćanja uvjeta
    const requestBody = {
      email: 'test@fer.hr',
      password: 'StrongPass123!',
      name: 'Test User',
      termsAccepted: false,
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Morate prihvatiti uvjete korištenja');
  });
});
