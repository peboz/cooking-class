import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const { courseId } = await params;

    // Fetch the course with all related data
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            instructorProfile: {
              select: {
                bio: true,
                specializations: true,
              },
            },
          },
        },
        modules: {
          include: {
            lessons: {
              include: {
                ingredients: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        media: true,
        reviews: {
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
            createdAt: 'desc',
          },
        },
      progress: {
        where: {
          userId: session.user.id,
        },
        select: {
          lessonId: true,
          completed: true,
        },
      },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Tečaj nije pronađen' },
        { status: 404 }
      );
    }

    // Check if course is published (unless user is instructor or admin)
    if (!course.published && 
        course.instructorId !== session.user.id && 
        session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Tečaj nije dostupan' },
        { status: 403 }
      );
    }

    // Type assertion to fix TypeScript inference issue with Prisma includes
    const courseData = course as {
      modules: Array<{ lessons: Array<{ durationMin: number | null }> }>;
      reviews: Array<{ rating: number }>;
      media: Array<{ type: string; url: string }>;
      [key: string]: unknown;
    };

    // Calculate stats
    const lessonCount = courseData.modules.reduce(
      (acc: number, module) => acc + module.lessons.length,
      0
    );

    // Get all progress for this course (not just completed lessons)
    const allProgress = await prisma.progress.findMany({
      where: {
        userId: session.user.id,
        courseId: courseId,
      },
      select: {
        lessonId: true,
        completed: true,
      },
    });

    const completedLessons = allProgress
      .filter(p => p.completed)
      .map(p => p.lessonId)
      .filter(Boolean) as string[];

    // Check which modules are locked
    // A module is locked if previous modules have quizzes that aren't all passed
    const moduleLockStatus = await Promise.all(
      courseData.modules.map(async (module: { id: string; lessons: Array<unknown> }, moduleIndex: number) => {
        // First module is never locked
        if (moduleIndex === 0) {
          return { moduleId: module.id, isLocked: false };
        }

        // Get all previous modules
        const previousModules = courseData.modules.slice(0, moduleIndex);

        // Check if any previous module has incomplete quizzes
        for (const prevModule of previousModules) {
          // Get all lessons with quizzes in this module
          const lessonsWithQuizzes = await prisma.lesson.findMany({
            where: {
              moduleId: prevModule.id,
            },
            include: {
              quiz: {
                select: {
                  id: true,
                  passingScore: true,
                },
              },
            },
          });

          const quizzesInModule = lessonsWithQuizzes.filter(l => l.quiz !== null);

          // If no quizzes, skip this module
          if (quizzesInModule.length === 0) {
            continue;
          }

          // Check if all quizzes in this module are passed
          for (const lesson of quizzesInModule) {
            if (!lesson.quiz) continue;

            const submission = await prisma.quizSubmission.findFirst({
              where: {
                quizId: lesson.quiz.id,
                userId: session.user.id,
              },
              orderBy: {
                submittedAt: 'desc',
              },
            });

            let quizPassed = false;
            if (submission) {
              if (lesson.quiz.passingScore === null) {
                quizPassed = true;
              } else {
                quizPassed = (submission.score ?? 0) >= lesson.quiz.passingScore;
              }
            }

            if (!quizPassed) {
              return { moduleId: module.id, isLocked: true };
            }
          }
        }

        return { moduleId: module.id, isLocked: false };
      })
    );

    const lockedModules = moduleLockStatus
      .filter(m => m.isLocked)
      .map(m => m.moduleId);

    return NextResponse.json({
      id: course.id,
      title: course.title,
      description: course.description,
      difficulty: course.difficulty,
      cuisineType: course.cuisineType,
      tags: course.tags,
      published: course.published,
      instructorId: course.instructorId,
      instructor: {
        id: courseData.instructor.id,
        name: courseData.instructor.name,
        email: courseData.instructor.email,
        image: courseData.instructor.image,
        instructorProfile: courseData.instructor.instructorProfile ? {
          bio: courseData.instructor.instructorProfile.bio,
          specializations: courseData.instructor.instructorProfile.specializations,
          verified: courseData.instructor.instructorProfile.verified,
        } : null,
      },
      modules: courseData.modules.map((module: { id: string; title: string; description: string | null; order: number; lessons: Array<{ id: string; title: string; description: string | null; order: number; durationMin: number | null }> }) => ({
        id: module.id,
        title: module.title,
        description: module.description,
        order: module.order,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lessons: module.lessons.map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          order: lesson.order,
          durationMin: lesson.durationMin,
        })),
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reviews: courseData.reviews.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: {
          id: review.user.id,
          name: review.user.name,
          image: review.user.image,
        },
      })),
      media: courseData.media.map((m: { id: string; url: string; type: string }) => ({
        id: m.id,
        url: m.url,
        type: m.type,
      })),
      progress: allProgress.map(p => ({
        lessonId: p.lessonId,
        completed: p.completed,
      })),
      lockedModules,
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju tečaja' },
      { status: 500 }
    );
  }
}
