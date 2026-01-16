/**
 * TEST 3: Duplicate Email Registration (Error Handling)
 * 
 * Ispitni slučaj: Registracija korisnika s već postojećim emailom - izazivanje pogreške
 * API: POST /api/auth/register
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/register/route';
import { createMockPrisma } from '@/tests/helpers/db-helpers';
import { testUsers } from '@/tests/fixtures/test-data';

// Mock dependencies BEFORE importing
vi.mock('@/prisma');
vi.mock('bcryptjs');
vi.mock('@/lib/tokens');
vi.mock('@/lib/email');

import { prisma } from '@/prisma';

describe('Duplicate Email Registration - Error Handling', () => {
  beforeEach(() => {
    Object.assign(prisma, createMockPrisma());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should reject registration with existing email', async () => {
    // Ulazni podaci: email koji već postoji u bazi
    const requestBody = {
      email: 'existing@fer.hr',
      password: 'NewPassword123!',
      name: 'New User',
    };

    // Mock: korisnik već postoji
    const existingUser = {
      ...testUsers.student,
      email: requestBody.email,
      password: '$2a$10$existinghash',
      accounts: [], // No OAuth accounts
    };

    (prisma.user.findUnique as any).mockResolvedValue({
      ...existingUser,
      accounts: [],
    });

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Očekivani rezultat: greška 400
    expect(response.status).toBe(400);
    expect(data.error).toBe('Već ste se registrirali s tom e-mail adresom');

    // Verify no new user was created
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('should handle OAuth user trying to register with password', async () => {
    // Ulazni podaci: korisnik koji se registrirao preko Google-a pokušava stvoriti lozinku
    const requestBody = {
      email: 'oauth@fer.hr',
      password: 'Password123!',
      name: 'OAuth User',
    };

    // Mock: korisnik postoji preko OAuth-a (Google), ali nema lozinku
    const oauthUser = {
      ...testUsers.student,
      email: requestBody.email,
      password: null, // No password - registered via OAuth
      accounts: [
        {
          provider: 'google',
          providerAccountId: 'google-123',
        },
      ],
    };

    (prisma.user.findUnique as any).mockResolvedValue(oauthUser);

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Očekivani rezultat: specifična poruka za OAuth korisnike
    expect(response.status).toBe(400);
    expect(data.error).toContain('Google');
    expect(data.error).toContain('zahtijevajte postavljanje lozinke');
    expect(data.oauthAccount).toBe(true);
    expect(data.providers).toContain('google');

    // Verify no new user was created
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('should handle multiple OAuth providers scenario', async () => {
    // Ulazni podaci: korisnik s više OAuth providera
    const requestBody = {
      email: 'multi-oauth@fer.hr',
      password: 'Password123!',
      name: 'Multi OAuth User',
    };

    // Mock: korisnik s više OAuth računa
    const multiOAuthUser = {
      ...testUsers.student,
      email: requestBody.email,
      password: null,
      accounts: [
        { provider: 'google' },
        { provider: 'github' },
      ],
    };

    (prisma.user.findUnique as any).mockResolvedValue(multiOAuthUser);

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Očekivani rezultat: poruka sa svim providerima
    expect(response.status).toBe(400);
    expect(data.error).toContain('Google ili Github');
    expect(data.oauthAccount).toBe(true);
    expect(data.providers).toEqual(['google', 'github']);
  });

  it('should allow registration if email does not exist', async () => {
    // Ulazni podaci: novi, nepostojeći email
    const requestBody = {
      email: 'new@fer.hr',
      password: 'Password123!',
      name: 'New User',
    };

    // Mock: korisnik ne postoji
    (prisma.user.findUnique as any).mockResolvedValue(null);

    // Mock successful creation
    const bcrypt = await import('bcryptjs');
    (bcrypt.hash as any).mockResolvedValue('$2a$10$hashedpass');
    
    (prisma.user.create as any).mockResolvedValue({
      id: 'new-id',
      ...requestBody,
      password: '$2a$10$hashedpass',
    });

    const { generateVerificationToken } = await import('@/lib/tokens');
    const { sendVerificationEmail } = await import('@/lib/email');
    (generateVerificationToken as any).mockResolvedValue('token');
    (sendVerificationEmail as any).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);

    // Očekivani rezultat: uspješna registracija
    expect(response.status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalled();
  });
});
