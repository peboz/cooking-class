import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generatePasswordResetToken } from '@/lib/tokens';
import { sendSetPasswordEmail } from '@/lib/email';
import { prisma } from '@/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has a password
    if (user.password) {
      return NextResponse.json(
        { error: 'Password already set' },
        { status: 400 }
      );
    }

    // Generate token and send email (reusing password reset token)
    const token = await generatePasswordResetToken(session.user.email);
    await sendSetPasswordEmail(session.user.email, token);

    return NextResponse.json(
      { message: 'Password setup link sent to your email' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Request set password error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}

