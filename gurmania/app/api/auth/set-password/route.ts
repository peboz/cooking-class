import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/prisma';
import { verifyPasswordResetToken, deletePasswordResetToken } from '@/lib/tokens';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token i lozinka su obavezni' },
        { status: 400 }
      );
    }

    // Verify token (reusing password reset token logic)
    const result = await verifyPasswordResetToken(token);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: result.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Korisnik nije pronađen' },
        { status: 404 }
      );
    }

    // Check if user already has a password
    if (user.password) {
      return NextResponse.json(
        { error: 'Lozinka je već postavljena. Koristite reset lozinke.' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set user password
    await prisma.user.update({
      where: { email: result.email },
      data: {
        password: hashedPassword,
      },
    });

    // Delete used token
    await deletePasswordResetToken(token);

    return NextResponse.json(
      { message: 'Lozinka je uspješno postavljena' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Set password error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom postavljanja lozinke' },
      { status: 500 }
    );
  }
}

