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
    const { bio, specializations, verificationDocumentUrl } = body;

    if (!bio || !specializations || specializations.length === 0) {
      return NextResponse.json(
        { error: 'Biografija i specijalizacije su obavezne' },
        { status: 400 }
      );
    }

    if (!verificationDocumentUrl) {
      return NextResponse.json(
        { error: 'Verifikacijski dokument (ID) je obavezan' },
        { status: 400 }
      );
    }

    // Check if instructor profile already exists
    const existingProfile = await prisma.instructorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existingProfile) {
      return NextResponse.json(
        { 
          error: 'Već imate instruktorski profil ili zahtjev na čekanju',
          profile: {
            verificationStatus: existingProfile.verificationStatus,
            verified: existingProfile.verified,
          }
        },
        { status: 400 }
      );
    } else {
      // Create new instructor profile (unverified by default)
      const newProfile = await prisma.instructorProfile.create({
        data: {
          userId: session.user.id,
          bio,
          specializations,
          verificationDocumentUrl: verificationDocumentUrl || null,
          verified: false, // Needs admin approval
        },
      });

      // Update user role to INSTRUCTOR
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: 'INSTRUCTOR' },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'INSTRUCTOR_REQUEST',
          entityType: 'InstructorProfile',
          entityId: newProfile.id,
          metadata: {
            bio,
            specializations,
          },
        },
      });

      return NextResponse.json(
        {
          message: 'Zahtjev za instruktora poslan. Čeka odobrenje administratora.',
          profile: newProfile,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Instructor profile error:', error);
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

    const profile = await prisma.instructorProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        bio: true,
        specializations: true,
        verificationStatus: true,
        verified: true,
        verificationReason: true,
        verificationDocumentUrl: true,
        createdAt: true,
        updatedAt: true,
      },
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
    console.error('Get instructor profile error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bio, specializations } = body;

    // Check if instructor profile exists
    const profile = await prisma.instructorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Instruktorski profil nije pronađen' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: { bio?: string | null; specializations?: string[] } = {};
    
    if (bio !== undefined) {
      updateData.bio = bio?.trim() || null;
    }
    
    if (specializations !== undefined) {
      if (!Array.isArray(specializations) || specializations.length === 0) {
        return NextResponse.json(
          { error: 'Potrebna je barem jedna specijalizacija' },
          { status: 400 }
        );
      }
      updateData.specializations = specializations;
    }

    // Update profile
    const updatedProfile = await prisma.instructorProfile.update({
      where: { userId: session.user.id },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'InstructorProfile',
        entityId: updatedProfile.id,
        metadata: {
          bio: updateData.bio,
          specializations: updateData.specializations,
        },
      },
    });

    return NextResponse.json(
      { 
        message: 'Profil uspješno ažuriran',
        profile: updatedProfile 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update instructor profile error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom ažuriranja profila' },
      { status: 500 }
    );
  }
}
