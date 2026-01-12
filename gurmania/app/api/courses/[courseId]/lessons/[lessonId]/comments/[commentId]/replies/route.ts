import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { sendReplyNotification } from '@/lib/email';

export async function POST(
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
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Sadržaj odgovora je obavezan' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Odgovor ne može biti duži od 2000 znakova' },
        { status: 400 }
      );
    }

    // Fetch the comment with lesson and course info
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
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

    // Only approved comments can be replied to
    if (comment.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Ne možete odgovoriti na komentar koji nije odobren' },
        { status: 400 }
      );
    }

    // Check if user is enrolled, instructor, or admin
    const isInstructor = comment.lesson.module.course.instructorId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isInstructor && !isAdmin) {
      const enrollment = await prisma.progress.findFirst({
        where: {
          userId: session.user.id,
          courseId: courseId,
        },
      });

      if (!enrollment) {
        return NextResponse.json(
          { error: 'Morate se upisati na tečaj prije odgovaranja na komentare' },
          { status: 403 }
        );
      }
    }

    // Create reply
    const reply = await prisma.commentReply.create({
      data: {
        commentId: commentId,
        userId: session.user.id,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Send email notification to comment author (if not replying to own comment)
    if (comment.user.id !== session.user.id && comment.user.email) {
      try {
        await sendReplyNotification(
          comment.user.email,
          comment.user.name || 'Korisnik',
          session.user.name || 'Netko',
          content.trim(),
          comment.content,
          comment.lesson.title,
          comment.lesson.module.course.title,
          courseId,
          lessonId
        );
      } catch (emailError) {
        console.error('Error sending reply notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json(
      { error: 'Greška pri stvaranju odgovora' },
      { status: 500 }
    );
  }
}
