import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

// PATCH - Approve or reject verification request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body; // action: 'APPROVE' or 'REJECT'

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be APPROVE or REJECT.' },
        { status: 400 }
      );
    }

    // Find the instructor profile
    const instructorProfile = await prisma.instructorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!instructorProfile) {
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      );
    }

    // Update instructor profile
    const updatedProfile = await prisma.instructorProfile.update({
      where: { id },
      data: {
        verificationStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        verified: action === 'APPROVE',
        verificationReason: reason || null,
      },
    });

    // If approved, update user role to INSTRUCTOR
    if (action === 'APPROVE') {
      await prisma.user.update({
        where: { id: instructorProfile.userId },
        data: { role: 'INSTRUCTOR' },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: action === 'APPROVE' ? 'INSTRUCTOR_APPROVED' : 'INSTRUCTOR_REJECTED',
        entityType: 'InstructorProfile',
        entityId: id,
        metadata: {
          instructorUserId: instructorProfile.userId,
          reason: reason || null,
          adminId: session.user.id,
        },
      },
    });

    // TODO: Send notification/email to the user about the decision

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: action === 'APPROVE' 
        ? 'Instructor request approved successfully' 
        : 'Instructor request rejected',
    });
  } catch (error) {
    console.error('Error updating verification request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
