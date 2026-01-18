import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/prisma';
import { generateVerificationToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, termsAccepted } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Nedostaju obavezna polja' },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: 'Morate prihvatiti uvjete korištenja' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (existingUser) {
      // Check if user has OAuth accounts
      const oauthProviders = existingUser.accounts.map(acc => acc.provider);
      
      if (oauthProviders.length > 0 && !existingUser.password) {
        // User registered with OAuth and doesn't have a password
        const providerNames = oauthProviders.map(p => 
          p.charAt(0).toUpperCase() + p.slice(1)
        ).join(' ili ');
        
        return NextResponse.json(
          { 
            error: `Već ste se registrirali s ${providerNames}. Molimo prijavite se s ${providerNames} ili zahtijevajte postavljanje lozinke.`,
            oauthAccount: true,
            providers: oauthProviders
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Već ste se registrirali s tom e-mail adresom' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    // Generate verification token and send email
    const token = await generateVerificationToken(email);
    await sendVerificationEmail(email, token);

    return NextResponse.json(
      {
        message: 'Registracija uspješna. Molimo provjerite svoj email za potvrdu računa.',
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom registracije' },
      { status: 500 }
    );
  }
}

