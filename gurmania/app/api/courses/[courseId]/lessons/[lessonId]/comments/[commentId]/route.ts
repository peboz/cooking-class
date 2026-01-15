import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string; commentId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const { courseId, lessonId, commentId } = await params;
    const body = await request.json();
    const { content, status } = body;

    // Fetch the comment with lesson and course info
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  select: {
                    id: true,
                    instructorId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Komentar nije pronađen' },
        { status: 404 }
      );
    }

    // Verify comment belongs to the lesson
    if (comment.lessonId !== lessonId) {
      return NextResponse.json(
        { error: 'Komentar ne pripada ovoj lekciji' },
        { status: 400 }
      );
    }

    if (comment.lesson.module.course.id !== courseId) {
      return NextResponse.json(
        { error: 'Lekcija ne pripada ovom tečaju' },
        { status: 400 }
      );
    }

    const isInstructor = comment.lesson.module.course.instructorId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    const isAuthor = comment.userId === session.user.id;

    // Handle content edit (only author can edit, only PENDING comments)
    if (content !== undefined) {
      if (!isAuthor) {
        return NextResponse.json(
          { error: 'Ne možete uređivati tuđe komentare' },
          { status: 403 }
        );
      }

      if (comment.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Možete uređivati samo komentare na čekanju' },
          { status: 400 }
        );
      }

      if (!content || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'Sadržaj komentara je obavezan' },
          { status: 400 }
        );
      }

      if (content.length > 2000) {
        return NextResponse.json(
          { error: 'Komentar ne može biti duži od 2000 znakova' },
          { status: 400 }
        );
      }

      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: { content: content.trim() },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({ comment: updatedComment });
    }

    // Handle status moderation (only instructor or admin)
    if (status !== undefined) {
      if (!isInstructor && !isAdmin) {
        return NextResponse.json(
          { error: 'Nemate dozvolu za moderiranje komentara' },
          { status: 403 }
        );
      }

      const validStatuses: CommentStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Nevažeći status' },
          { status: 400 }
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
              image: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({ comment: updatedComment });
    }

    return NextResponse.json(
      { error: 'Morate navesti sadržaj ili status' },
      { status: 400 }
    );
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
  { params }: { params: Promise<{ courseId: string; lessonId: string; commentId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const { courseId, lessonId, commentId } = await params;

    // Fetch the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  select: {
                    id: true,
                    instructorId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Komentar nije pronađen' },
        { status: 404 }
      );
    }

    // Verify comment belongs to the lesson
    if (comment.lessonId !== lessonId || comment.lesson.module.course.id !== courseId) {
      return NextResponse.json(
        { error: 'Nevažeći zahtjev' },
        { status: 400 }
      );
    }

    const isAdmin = session.user.role === 'ADMIN';
    const isAuthor = comment.userId === session.user.id;

    // Only author or admin can delete
    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Ne možete brisati tuđe komentare' },
        { status: 403 }
      );
    }

    // Delete comment (replies will cascade delete)
    await prisma.comment.delete({
      where: { id: commentId },
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
