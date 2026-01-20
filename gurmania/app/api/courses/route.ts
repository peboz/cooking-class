import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { Difficulty } from '@/app/generated/prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const difficulties = searchParams.get('difficulties')?.split(',').filter(Boolean) as Difficulty[] | undefined;
    const cuisineTypes = searchParams.get('cuisineTypes')?.split(',').filter(Boolean) || undefined;
    const allergens = searchParams.get('allergens')?.split(',').filter(Boolean) || undefined;
    const sortBy = searchParams.get('sortBy') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      published: true,
      deletedAt: null,
      instructor: {
        isActive: true,
      },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    if (difficulties && difficulties.length > 0) {
      where.difficulty = { in: difficulties };
    }

    if (cuisineTypes && cuisineTypes.length > 0) {
      where.cuisineType = { in: cuisineTypes };
    }

    if (allergens && allergens.length > 0) {
      // Exclude courses that have any lessons containing these allergens
      where.modules = {
        every: {
          lessons: {
            none: {
              allergenTags: {
                hasSome: allergens,
              },
            },
          },
        },
      };
    }

    // Build orderBy clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'popular') {
      // For now, order by number of progress records (proxy for popularity)
      // In production, you might want a dedicated popularity score
      orderBy = { createdAt: 'desc' };
    }

    // Fetch courses
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          modules: {
            include: {
              lessons: true,
            },
          },
          media: true,
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.course.count({ where }),
    ]);

    // Calculate stats for each course
    const coursesWithStats = courses.map(course => {
      const moduleCount = course.modules.length;
      const lessonCount = course.modules.reduce(
        (acc, module) => acc + module.lessons.length,
        0
      );
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((acc, r) => acc + r.rating, 0) / course.reviews.length
        : 0;
      const totalReviews = course.reviews.length;
      const thumbnail = course.media.find(m => m.type === 'IMAGE')?.url || '/placeholder-course.jpg';
      const totalDuration = course.modules.reduce(
        (acc, module) => acc + module.lessons.reduce(
          (lAcc, lesson) => lAcc + (lesson.durationMin || 0),
          0
        ),
        0
      );

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        difficulty: course.difficulty,
        cuisineType: course.cuisineType,
        tags: course.tags,
        thumbnail,
        instructor: {
          id: course.instructor.id,
          name: course.instructor.name,
          image: course.instructor.image,
        },
        moduleCount,
        lessonCount,
        avgRating,
        totalReviews,
        totalDuration,
      };
    });

    return NextResponse.json({
      courses: coursesWithStats,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju tečajeva' },
      { status: 500 }
    );
  }
}
