import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { generateVerificationToken, canResendVerificationEmail } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/email';

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

    if (!user) {
      return NextResponse.json(
        { error: 'Korisnik nije pronađen' },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email je već potvrđen' },
        { status: 400 }
      );
    }

    // Check cooldown period
    const canResend = await canResendVerificationEmail(email);
    if (!canResend) {
      return NextResponse.json(
        { error: 'Molimo pričekajte 1 sat prije zahtjeva za novu potvrdu emaila' },
        { status: 429 }
      );
    }

    // Generate new token and send email
    const token = await generateVerificationToken(email);
    await sendVerificationEmail(email, token);

    return NextResponse.json(
      { message: 'Verification email sent' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Greška prilikom ponovnog slanja potvrde emaila:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom slanja potvrde emaila' },
      { status: 500 }
    );
  }
}

