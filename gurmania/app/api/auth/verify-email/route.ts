import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { verifyEmailToken, deleteVerificationToken } from '@/lib/tokens';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token je obavezan' },
        { status: 400 }
      );
    }

    // Verify token
    const result = await verifyEmailToken(token);

    if (result.error) {
      console.error('Token verification failed:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    if (!result.email) {
      console.error('Token verification returned no email');
      return NextResponse.json(
        { error: 'Neispravan token' },
        { status: 400 }
      );
    }

    // Check if user is already verified
    const existingUser = await prisma.user.findUnique({
      where: { email: result.email },
      select: { emailVerified: true },
    });

    if (existingUser?.emailVerified) {
      // Delete the token since it's no longer needed
      await deleteVerificationToken(token).catch(() => {});
      return NextResponse.json(
        { message: 'E-mail je već potvrđen. Možete se prijaviti.' },
        { status: 200 }
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
      { message: 'E-mail je uspješno potvrđen' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Greška prilikom potvrde e-maila:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom potvrde e-maila' },
      { status: 500 }
    );
  }
}

