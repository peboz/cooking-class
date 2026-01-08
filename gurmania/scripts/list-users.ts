#!/usr/bin/env tsx

/**
 * List Users Script
 * 
 * Usage:
 *   npm run list-users [--admins-only]
 * 
 * Examples:
 *   npm run list-users              # List all users
 *   npm run list-users --admins-only # List only admins
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables from both .env and .env.local
// .env.local will override .env values
const envPath = resolve(process.cwd(), '.env');
const envLocalPath = resolve(process.cwd(), '.env.local');

if (existsSync(envPath)) {
  config({ path: envPath });
}
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true });
}

import { PrismaClient, Role } from '../app/generated/prisma/client.js';

const prisma = new PrismaClient();

async function listUsers(adminsOnly: boolean = false) {
  try {
    const whereClause = adminsOnly ? { role: Role.ADMIN } : {};
    
    console.log(adminsOnly ? '👑 Admin Users:\n' : '👥 All Users:\n');

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (users.length === 0) {
      console.log('No users found.');
      return;
    }

    console.log(`Found ${users.length} user${users.length !== 1 ? 's' : ''}:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Verified: ${user.emailVerified ? '✅' : '❌'}`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Check for --admins-only flag
const adminsOnly = process.argv.includes('--admins-only');

listUsers(adminsOnly);
