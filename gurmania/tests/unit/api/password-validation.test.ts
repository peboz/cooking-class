/**
 * TEST 2: Password Validation During Registration (Boundary Condition)
 * 
 * Ispitni slučaj: Validacija lozinke prilikom registracije - rubni uvjet
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

describe('Password Validation - Boundary Conditions', () => {
  beforeEach(() => {
    Object.assign(prisma, createMockPrisma());
    vi.clearAllMocks();

    // Setup default mocks
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (bcrypt.hash as any).mockResolvedValue('$2a$10$hashedpassword');
    (prisma.user.create as any).mockResolvedValue({
      id: 'user-id',
      email: 'test@test.com',
      name: 'Test',
    });
    (generateVerificationToken as any).mockResolvedValue('token');
    (sendVerificationEmail as any).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should reject empty password', async () => {
    // Ulazni podaci: prazna lozinka
    const requestBody = {
      email: 'test@fer.hr',
      password: '',
      name: 'Test User',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Očekivani rezultat: greška
    expect(response.status).toBe(400);
    expect(data.error).toContain('Nedostaju obavezna polja');
  });

  it('should accept very short password (boundary test)', async () => {
    // Ulazni podaci: vrlo kratka lozinka
    const requestBody = {
      email: 'test@fer.hr',
      password: '12',
      name: 'Test User',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);

    // Dobiveni rezultat: prihvaća kratku lozinku (nema validacije duljine)
    expect(response.status).toBe(201);
    expect(bcrypt.hash).toHaveBeenCalledWith('12', 10);
  });

  it('should accept very long password (boundary test)', async () => {
    // Ulazni podaci: vrlo duga lozinka (1000 znakova)
    const longPassword = 'a'.repeat(1000);
    const requestBody = {
      email: 'test@fer.hr',
      password: longPassword,
      name: 'Test User',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);

    // Dobiveni rezultat: prihvaća dugu lozinku
    expect(response.status).toBe(201);
    expect(bcrypt.hash).toHaveBeenCalledWith(longPassword, 10);
  });

  it('should accept password with special characters', async () => {
    // Ulazni podaci: lozinka sa specijalnim znakovima
    const specialPassword = '!@#$%^&*()_+-={}[]|:;"<>,.?/~`';
    const requestBody = {
      email: 'test@fer.hr',
      password: specialPassword,
      name: 'Test User',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Očekivani rezultat: uspješna registracija
    expect(response.status).toBe(201);
    expect(data.message).toContain('Registracija uspješna');
    expect(bcrypt.hash).toHaveBeenCalledWith(specialPassword, 10);
  });

  it('should accept password with unicode characters', async () => {
    // Ulazni podaci: lozinka sa unicode znakovima
    const unicodePassword = 'Пароль123@ąćęłńóśźż';
    const requestBody = {
      email: 'test@fer.hr',
      password: unicodePassword,
      name: 'Test User',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);

    // Dobiveni rezultat: prihvaća unicode znakove
    expect(response.status).toBe(201);
    expect(bcrypt.hash).toHaveBeenCalledWith(unicodePassword, 10);
  });
});
