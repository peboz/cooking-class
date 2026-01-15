import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

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

    // Fetch the lesson with all related data
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                published: true,
                instructorId: true,
              },
            },
            lessons: {
              select: {
                id: true,
                title: true,
                order: true,
              },
              orderBy: {
                order: 'asc',
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
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lekcija nije pronađena' },
        { status: 404 }
      );
    }

    // Verify the lesson belongs to the requested course
    if (lesson.module.course.id !== courseId) {
      return NextResponse.json(
        { error: 'Lekcija ne pripada ovom tečaju' },
        { status: 400 }
      );
    }

    // Check if course is published (unless user is instructor or admin)
    if (!lesson.module.course.published && 
        lesson.module.course.instructorId !== session.user.id && 
        session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Lekcija nije dostupna' },
        { status: 403 }
      );
    }

    // Check if user is enrolled in the course (unless user is instructor or admin)
    if (lesson.module.course.instructorId !== session.user.id && 
        session.user.role !== 'ADMIN') {
      const enrollment = await prisma.progress.findFirst({
        where: {
          userId: session.user.id,
          courseId: courseId,
        },
      });

      if (!enrollment) {
        return NextResponse.json(
          { error: 'Morate se upisati na tečaj prije pristupa lekcijama' },
          { status: 403 }
        );
      }
    }

    // Find next and previous lessons
    const currentLessonIndex = lesson.module.lessons.findIndex(l => l.id === lessonId);
    const previousLesson = currentLessonIndex > 0 
      ? lesson.module.lessons[currentLessonIndex - 1] 
      : null;
    const nextLesson = currentLessonIndex < lesson.module.lessons.length - 1
      ? lesson.module.lessons[currentLessonIndex + 1]
      : null;

    // Get user progress for this lesson
    const progress = await prisma.progress.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseId,
        lessonId: lessonId,
      },
    });

    const isCompleted = progress?.completed || false;

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
          quizPassed = true;
        } else {
          quizPassed = (submission.score ?? 0) >= lesson.quiz.passingScore;
        }
      }
    }

    return NextResponse.json({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      videoUrl: lesson.videoUrl,
      steps: lesson.steps,
      durationMin: lesson.durationMin,
      difficulty: lesson.difficulty,
      allergens: lesson.allergenTags,
      ingredients: lesson.ingredients.map(ing => ({
        id: ing.id,
        name: ing.ingredient.name,
        quantity: ing.quantity,
        unit: ing.unit,
        optional: ing.optional,
      })),
      module: {
        id: lesson.module.id,
        title: lesson.module.title,
      },
      course: {
        id: lesson.module.course.id,
        title: lesson.module.course.title,
      },
      navigation: {
        previousLesson: previousLesson ? {
          id: previousLesson.id,
          title: previousLesson.title,
        } : null,
        nextLesson: nextLesson ? {
          id: nextLesson.id,
          title: nextLesson.title,
        } : null,
      },
      quiz: lesson.quiz ? {
        id: lesson.quiz.id,
        title: lesson.quiz.title,
        passingScore: lesson.quiz.passingScore,
      } : null,
      userProgress: {
        isCompleted,
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
