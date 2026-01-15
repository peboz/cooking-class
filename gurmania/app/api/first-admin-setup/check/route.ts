import { NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { Role } from '@/app/generated/prisma/client';

// Check if any admin users exist
export async function GET() {
  try {
    const adminCount = await prisma.user.count({
      where: { role: Role.ADMIN },
    });

    return NextResponse.json({
      hasAdmin: adminCount > 0,
      needsSetup: adminCount === 0,
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
