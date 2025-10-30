import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { verifyEmailToken, deleteVerificationToken } from '@/lib/tokens';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify token
    const result = await verifyEmailToken(token);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Update user
    await prisma.user.update({
      where: { email: result.email },
      data: { emailVerified: new Date() },
    });

    // Delete used token
    await deleteVerificationToken(token);

    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred during email verification' },
      { status: 500 }
    );
  }
}

