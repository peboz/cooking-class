import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Neovlašteni pristup' },
        { status: 401 }
      );
    }

    const { lessonId } = await params;

    // Fetch lesson with all related data
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
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
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
          },
        },
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        media: {
          where: {
            type: 'VIDEO',
          },
          take: 1,
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lekcija nije pronađena' },
        { status: 404 }
      );
    }

    // Check if user has access to this course
    // For now, assuming all authenticated users have access
    // TODO: Add enrollment check when implemented

    // Check lesson progress
    const progress = await prisma.progress.findUnique({
      where: {
        userId_courseId_lessonId: {
          userId: session.user.id,
          courseId: lesson.module.course.id,
          lessonId: lesson.id,
        },
      },
    });

    // Check if quiz is passed
    let quizPassed = false;
    if (lesson.quiz) {
      const submission = await prisma.quizSubmission.findFirst({
        where: {
          quizId: lesson.quiz.id,
          userId: session.user.id,
        },
        orderBy: {
          submittedAt: 'desc',
        },
      });

      if (submission) {
        if (lesson.quiz.passingScore === null) {
          // No passing score set, any submission passes
          quizPassed = true;
        } else {
          quizPassed = (submission.score ?? 0) >= lesson.quiz.passingScore;
        }
      }
    }

    return NextResponse.json({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        videoUrl: lesson.videoUrl || lesson.media[0]?.url,
        steps: lesson.steps,
        durationMin: lesson.durationMin,
        difficulty: lesson.difficulty,
        prepTimeMin: lesson.prepTimeMin,
        cookTimeMin: lesson.cookTimeMin,
        cuisineType: lesson.cuisineType,
        allergenTags: lesson.allergenTags,
        ingredients: lesson.ingredients.map((li) => ({
          id: li.ingredient.id,
          name: li.ingredient.name,
          quantity: li.quantity,
          unit: li.unit,
        })),
        module: {
          id: lesson.module.id,
          title: lesson.module.title,
          course: {
            id: lesson.module.course.id,
            title: lesson.module.course.title,
          },
        },
        quiz: lesson.quiz
          ? {
              id: lesson.quiz.id,
              title: lesson.quiz.title,
              passingScore: lesson.quiz.passingScore,
            }
          : null,
      },
      progress: {
        completed: progress?.completed ?? false,
        percent: progress?.percent ?? 0,
      },
      quizPassed,
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju lekcije' },
      { status: 500 }
    );
  }
}
