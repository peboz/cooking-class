import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instructorId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const { instructorId } = await params;

    // Fetch instructor with profile
    const instructor = await prisma.user.findUnique({
      where: { 
        id: instructorId,
      },
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        instructorProfile: {
          select: {
            bio: true,
            specializations: true,
            verified: true,
          },
        },
      },
    });

    if (!instructor) {
      return NextResponse.json(
        { error: 'Korisnik nije pronađen' },
        { status: 404 }
      );
    }

    // Check if user has instructor profile (more flexible than role check)
    if (!instructor.instructorProfile) {
      return NextResponse.json(
        { error: 'Korisnik nema instruktorski profil' },
        { status: 404 }
      );
    }

    // Fetch published courses with their stats
    const courses = await prisma.course.findMany({
      where: {
        instructorId,
        published: true,
      },
      include: {
        media: {
          where: { type: 'IMAGE' },
          take: 1,
        },
        modules: {
          include: {
            lessons: {
              select: {
                id: true,
              },
            },
          },
        },
        reviews: {
          where: { status: 'APPROVED' },
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            progress: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform courses data
    const coursesData = courses.map((course) => {
      const lessonCount = course.modules.reduce(
        (acc: number, module) => acc + module.lessons.length,
        0
      );
      
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((acc: number, r) => acc + r.rating, 0) / course.reviews.length
        : 0;

      const thumbnail = course.media.find((m) => m.type === 'IMAGE')?.url || '/placeholder-course.jpg';

      // Map difficulty to Croatian
      const difficultyMap: Record<string, string> = {
        'EASY': 'Lako',
        'MEDIUM': 'Srednje',
        'HARD': 'Teško',
      };

      return {
        id: course.id,
        title: course.title,
        instructor: instructor.name || 'Nepoznat instruktor',
        level: difficultyMap[course.difficulty] || course.difficulty,
        rating: parseFloat(avgRating.toFixed(1)),
        lessonCount,
        image: thumbnail,
        enrollmentCount: course._count.progress,
      };
    });

    // Calculate instructor's average rating from their courses' ratings
    const coursesWithRatings = coursesData.filter(course => course.rating > 0);
    const avgInstructorRating = coursesWithRatings.length > 0
      ? coursesWithRatings.reduce((acc, course) => acc + course.rating, 0) / coursesWithRatings.length
      : 0;

    // Calculate unique students count across all courses
    const uniqueStudents = await prisma.progress.findMany({
      where: {
        course: {
          instructorId,
        },
      },
      distinct: ['userId'],
      select: {
        userId: true,
      },
    });

    return NextResponse.json({
      instructor: {
        id: instructor.id,
        name: instructor.name,
        image: instructor.image,
        bio: instructor.instructorProfile?.bio,
        specializations: instructor.instructorProfile?.specializations || [],
        verified: instructor.instructorProfile?.verified || false,
      },
      stats: {
        avgRating: parseFloat(avgInstructorRating.toFixed(1)),
        totalStudents: uniqueStudents.length,
        totalCourses: courses.length,
        reviewCount: coursesWithRatings.length,
      },
      courses: coursesData,
    });
  } catch (error) {
    console.error('Error fetching instructor profile:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju profila instruktora' },
      { status: 500 }
    );
  }
}
