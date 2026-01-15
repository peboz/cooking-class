import { NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { Role } from '@/app/generated/prisma/client';

// Get all users for first-time admin setup
export async function GET() {
  try {
    // Check if any admin already exists
    const adminCount = await prisma.user.count({
      where: { role: Role.ADMIN },
    });

    if (adminCount > 0) {
      return NextResponse.json(
        { error: 'Admin setup is no longer available' },
        { status: 403 }
      );
    }

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
