import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { sendInstructorApprovedEmail, sendInstructorRejectedEmail } from '@/lib/email';

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
    
    // If rejected, revert role to STUDENT if it was set to INSTRUCTOR
    if (action === 'REJECT' && instructorProfile.user.role === 'INSTRUCTOR') {
      await prisma.user.update({
        where: { id: instructorProfile.userId },
        data: { role: 'STUDENT' },
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

    // Send email notification to the user about the decision
    try {
      const userEmail = instructorProfile.user.email;
      if (!userEmail) {
        console.error('User email is missing, cannot send notification');
      } else {
        const userName = instructorProfile.user.name ?? userEmail;
        
        if (action === 'APPROVE') {
          await sendInstructorApprovedEmail(userEmail, userName);
        } else if (action === 'REJECT' && reason) {
          await sendInstructorRejectedEmail(userEmail, userName, reason);
        }
      }
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('Failed to send notification email:', emailError);
    }

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
