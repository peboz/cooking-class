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
        { error: 'Nemate pristup' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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
        { error: 'Lozinka je već postavljena' },
        { status: 400 }
      );
    }

    // Generate token and send email (reusing password reset token)
    const token = await generatePasswordResetToken(session.user.email);
    await sendSetPasswordEmail(session.user.email, token);

    return NextResponse.json(
      { message: 'Link za postavljanje lozinke poslan na vašu email adresu' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Greška prilikom zahtjeva postavljanja lozinke:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom obrade vašeg zahtjeva' },
      { status: 500 }
    );
  }
}

