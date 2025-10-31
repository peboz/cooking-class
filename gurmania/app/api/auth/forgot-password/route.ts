import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { generatePasswordResetToken } from '@/lib/tokens';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email je obavezan' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not for security
    if (!user) {
      return NextResponse.json(
        { message: 'Ako postoji račun s ovom email adresom, dobiti ćete link za resetiranje lozinke' },
        { status: 200 }
      );
    }

    // Check if user has a password (might be OAuth only)
    if (!user.password) {
      return NextResponse.json(
        { message: 'Ako postoji račun s ovom email adresom, dobiti ćete link za resetiranje lozinke' },
        { status: 200 }
      );
    }

    // Generate token and send email
    const token = await generatePasswordResetToken(email);
    await sendPasswordResetEmail(email, token);

    return NextResponse.json(
      { message: 'Ako postoji račun s ovom email adresom, dobiti ćete link za resetiranje lozinke' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Greška prilikom resetiranja lozinke:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom obrade vašeg zahtjeva' },
      { status: 500 }
    );
  }
}

