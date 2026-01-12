import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { sendQuestionNotification } from '@/lib/email';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const { courseId, lessonId } = await params;

    // Verify lesson belongs to course and get course info
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                instructorId: true,
                published: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lekcija nije pronađena' },
        { status: 404 }
      );
    }

    if (lesson.module.course.id !== courseId) {
      return NextResponse.json(
        { error: 'Lekcija ne pripada ovom tečaju' },
        { status: 400 }
      );
    }

    // Check if user is enrolled, instructor, or admin
    const isInstructor = lesson.module.course.instructorId === session.user.id;
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
          { error: 'Morate se upisati na tečaj prije pristupa komentarima' },
          { status: 403 }
        );
      }
    }

    // Fetch comments with filtering based on user role
    const whereConditions: any[] = [
      { status: 'APPROVED' }, // Everyone sees approved
    ];

    if (isInstructor || isAdmin) {
      // Instructors and admins see all
      whereConditions.push(
        { status: 'PENDING' },
        { status: 'REJECTED' }
      );
    } else {
      // Regular users see their own pending/rejected
      whereConditions.push(
        { 
          status: 'PENDING',
          userId: session.user.id,
        },
        {
          status: 'REJECTED',
          userId: session.user.id,
        }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        lessonId: lessonId,
        OR: whereConditions,
      },
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
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add metadata to comments
    const commentsWithMetadata = comments.map(comment => ({
      ...comment,
      canEdit: comment.userId === session.user.id && comment.status === 'PENDING',
      canDelete: comment.userId === session.user.id || isAdmin,
      canModerate: isInstructor || isAdmin,
      isInstructor: lesson.module.course.instructorId === comment.userId,
    }));

    return NextResponse.json({
      comments: commentsWithMetadata,
      meta: {
        isInstructor,
        isAdmin,
        courseInstructorId: lesson.module.course.instructorId,
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju komentara' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const { courseId, lessonId } = await params;
    const body = await request.json();
    const { content, isQuestion } = body;

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

    // Verify lesson belongs to course and get course info
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                instructorId: true,
                published: true,
                title: true,
                instructor: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lekcija nije pronađena' },
        { status: 404 }
      );
    }

    if (lesson.module.course.id !== courseId) {
      return NextResponse.json(
        { error: 'Lekcija ne pripada ovom tečaju' },
        { status: 400 }
      );
    }

    // Check if user is enrolled, instructor, or admin
    const isInstructor = lesson.module.course.instructorId === session.user.id;
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
          { error: 'Morate se upisati na tečaj prije komentiranja' },
          { status: 403 }
        );
      }
    }

    // Create comment with PENDING status
    const comment = await prisma.comment.create({
      data: {
        lessonId: lessonId,
        userId: session.user.id,
        content: content.trim(),
        isQuestion: isQuestion === true,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replies: true,
      },
    });

    // Send email notification to instructor if it's a question
    if (isQuestion && lesson.module.course.instructor?.email) {
      try {
        await sendQuestionNotification(
          lesson.module.course.instructor.email,
          lesson.module.course.instructor.name || 'Instruktor',
          lesson.title,
          lesson.module.course.title,
          content.trim(),
          courseId,
          lessonId
        );
      } catch (emailError) {
        console.error('Error sending question notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      comment: {
        ...comment,
        canEdit: true,
        canDelete: true,
        canModerate: isInstructor || isAdmin,
        isInstructor: false,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Greška pri stvaranju komentara' },
      { status: 500 }
    );
  }
}
