import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail je obavezan' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { exists: false },
        { status: 200 }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          exists: true,
          verified: false,
          message: 'Molimo potvrdite svoj e-mail kako biste aktivirali račun',
        },
        { status: 200 }
      );
    }

    // Determine available auth methods
    const hasPassword = !!user.password;
    const oauthProviders = user.accounts.map(acc => acc.provider);

    return NextResponse.json(
      {
        exists: true,
        verified: true,
        hasPassword,
        oauthProviders,
        name: user.name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Greška prilikom provjere e-maila:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom provjere e-maila' },
      { status: 500 }
    );
  }
}

