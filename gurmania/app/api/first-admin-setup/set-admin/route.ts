import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { Role } from '@/app/generated/prisma/client';

// Set first admin user
export async function POST(request: NextRequest) {
  try {
    // Check if any admin already exists
    const adminCount = await prisma.user.count({
      where: { role: Role.ADMIN },
    });

    if (adminCount > 0) {
      return NextResponse.json(
        { error: 'Admin user already exists. This setup is only available for initial setup.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user to admin
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: Role.ADMIN },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: updatedUser.id,
        action: 'FIRST_ADMIN_SETUP',
        entityType: 'User',
        entityId: updatedUser.id,
        metadata: {
          previousRole: user.role,
          newRole: 'ADMIN',
          setupType: 'first-time',
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Error setting first admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
