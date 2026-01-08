import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { skillLevel, dietaryPreferences, allergies, favoriteCuisines } = body;

    if (!skillLevel) {
      return NextResponse.json(
        { error: 'Razina vještine je obavezna' },
        { status: 400 }
      );
    }

    // Check if valid skill level
    const validSkillLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
    if (!validSkillLevels.includes(skillLevel)) {
      return NextResponse.json(
        { error: 'Neispravna razina vještine' },
        { status: 400 }
      );
    }

    // Check if student profile already exists
    const existingProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existingProfile) {
      // Update existing profile
      const updatedProfile = await prisma.studentProfile.update({
        where: { userId: session.user.id },
        data: {
          skillLevel,
          dietaryPreferences: dietaryPreferences || [],
          allergies: allergies || [],
          favoriteCuisines: favoriteCuisines || [],
        },
      });

      return NextResponse.json(
        {
          message: 'Profil uspješno ažuriran',
          profile: updatedProfile,
        },
        { status: 200 }
      );
    } else {
      // Create new profile
      const newProfile = await prisma.studentProfile.create({
        data: {
          userId: session.user.id,
          skillLevel,
          dietaryPreferences: dietaryPreferences || [],
          allergies: allergies || [],
          favoriteCuisines: favoriteCuisines || [],
        },
      });

      return NextResponse.json(
        {
          message: 'Profil uspješno kreiran',
          profile: newProfile,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Student profile error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom spremanja profila' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil nije pronađen' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { profile },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get student profile error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške' },
      { status: 500 }
    );
  }
}
