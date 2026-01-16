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

    const userId = session.user.id;
    const body = await request.json();
    const { confirmationPhrase } = body;

    // Verify confirmation phrase
    if (confirmationPhrase !== 'IZBRIŠI MOJ RAČUN') {
      return NextResponse.json(
        { error: 'Potvrdna fraza nije točna. Molimo upišite "IZBRIŠI MOJ RAČUN" za potvrdu.' },
        { status: 400 }
      );
    }

    // Log the account deletion in audit log before deleting
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_ACCOUNT',
        entityType: 'User',
        entityId: userId,
        metadata: {
          deletedAt: new Date().toISOString(),
          reason: 'User requested account deletion',
        },
      },
    });

    // Delete user account
    // Note: Thanks to Prisma's cascade delete (onDelete: Cascade),
    // all related data will be automatically deleted:
    // - StudentProfile
    // - InstructorProfile
    // - Accounts (OAuth)
    // - Sessions
    // - Courses (and their modules, lessons, etc.)
    // - Workshops
    // - Reviews
    // - Reservations
    // - Progress
    // - Certificates
    // - QuizSubmissions
    // - Comments and CommentReplies
    // - ShoppingLists
    // - InstructorFollows (both as student and instructor)
    // - Notifications
    // - Most AuditLogs (those with userId reference)
    
    await prisma.user.delete({
      where: { id: userId },
    });

    // Note: The user is still authenticated in their current session.
    // We should sign them out, but since this is an API route,
    // we'll return a success response and let the client handle sign out.

    return NextResponse.json(
      { 
        success: true,
        message: 'Vaš račun je trajno izbrisan. Bit ćete odjavljeni.' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom brisanja računa' },
      { status: 500 }
    );
  }
}
