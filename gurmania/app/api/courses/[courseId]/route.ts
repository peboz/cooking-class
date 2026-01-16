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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const courseData = course as any;

    // Calculate stats
    const moduleCount = courseData.modules.length;
     
    const lessonCount = courseData.modules.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc: number, module: any) => acc + module.lessons.length,
      0
    );
    const avgRating = courseData.reviews.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? courseData.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / courseData.reviews.length
      : 0;
    const totalReviews = courseData.reviews.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const thumbnail = courseData.media.find((m: any) => m.type === 'IMAGE')?.url || '/placeholder-course.jpg';
     
    const totalDuration = courseData.modules.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc: number, module: any) => acc + module.lessons.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (lAcc: number, lesson: any) => lAcc + (lesson.durationMin || 0),
        0
      ),
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
    const progressPercentage = lessonCount > 0 
      ? (completedLessons.length / lessonCount) * 100 
      : 0;
    const isEnrolled = allProgress.length > 0;

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      modules: courseData.modules.map((module: any) => ({
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
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju tečaja' },
      { status: 500 }
    );
  }
}
