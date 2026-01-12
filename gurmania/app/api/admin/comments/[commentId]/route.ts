import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nemate dozvolu pristupa' },
        { status: 403 }
      );
    }

    const { commentId } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses: CommentStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Nevažeći status' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Komentar nije pronađen' },
        { status: 404 }
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { status: status as CommentStatus },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: `COMMENT_${status}`,
        entityType: 'Comment',
        entityId: commentId,
        metadata: {
          commentId,
          userId: comment.userId,
          status,
        },
      },
    });

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju komentara' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nemate dozvolu pristupa' },
        { status: 403 }
      );
    }

    const { commentId } = await params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Komentar nije pronađen' },
        { status: 404 }
      );
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'COMMENT_DELETED',
        entityType: 'Comment',
        entityId: commentId,
        metadata: {
          commentId,
          userId: comment.userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju komentara' },
      { status: 500 }
    );
  }
}
