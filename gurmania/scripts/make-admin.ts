#!/usr/bin/env tsx

/**
 * Make User Admin Script
 * 
 * Usage:
 *   npm run make-admin <email>
 * 
 * Example:
 *   npm run make-admin user@example.com
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

import { PrismaClient } from '../app/generated/prisma/client.js';

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
  try {
    console.log(`🔍 Searching for user with email: ${email}`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User with email "${email}" not found.`);
      process.exit(1);
    }

    // Check if already admin
    if (user.role === 'ADMIN') {
      console.log(`ℹ️  User "${email}" is already an admin.`);
      process.exit(0);
    }

    // Update user role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: updatedUser.id,
        action: 'ROLE_CHANGED',
        entityType: 'User',
        entityId: updatedUser.id,
        metadata: {
          oldRole: user.role,
          newRole: 'ADMIN',
          changedBy: 'script',
        },
      },
    });

    console.log(`✅ Successfully made "${email}" an admin!`);
    console.log(`   User ID: ${updatedUser.id}`);
    console.log(`   Name: ${updatedUser.name || 'N/A'}`);
    console.log(`   Role: ${updatedUser.role}`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address.');
  console.log('\nUsage:');
  console.log('  npm run make-admin <email>');
  console.log('\nExample:');
  console.log('  npm run make-admin user@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Invalid email format.');
  process.exit(1);
}

makeAdmin(email);
