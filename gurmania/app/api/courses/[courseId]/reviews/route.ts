import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { uploadToS3, getPublicUrl } from '@/lib/s3';

// GET - Get all reviews for a course
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

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Tečaj nije pronađen' },
        { status: 404 }
      );
    }

    // Get all reviews for the course
    const reviews = await prisma.review.findMany({
      where: {
        courseId,
        targetType: 'COURSE',
        OR: [
          { status: 'APPROVED' },
          { userId: session.user.id },
        ],
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju recenzija' },
      { status: 500 }
    );
  }
}

// POST - Create or update a review for a course
export async function POST(
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
    const formData = await request.formData();

    const rating = parseInt(formData.get('rating') as string);
    const comment = formData.get('comment') as string | null;
    const photo = formData.get('photo') as File | null;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Ocjena mora biti između 1 i 5' },
        { status: 400 }
      );
    }

    if (comment && comment.length > 2000) {
      return NextResponse.json(
        { error: 'Komentar ne smije biti duži od 2000 znakova' },
        { status: 400 }
      );
    }

    // Verify course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        instructorId: true,
        published: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Tečaj nije pronađen' },
        { status: 404 }
      );
    }

    if (!course.published) {
      return NextResponse.json(
        { error: 'Ne možete recenzirati neobjavljeni tečaj' },
        { status: 400 }
      );
    }

    // Prevent instructors from rating their own courses
    if (course.instructorId === session.user.id) {
      return NextResponse.json(
        { error: 'Ne možete recenzirati vlastiti tečaj' },
        { status: 400 }
      );
    }

    // Check if user has completed all lessons
    const modules = await prisma.module.findMany({
      where: { courseId },
      include: {
        lessons: {
          select: { id: true },
        },
      },
    });

    const allLessonIds = modules.flatMap(m => m.lessons.map(l => l.id));
    
    const completedProgress = await prisma.progress.findMany({
      where: {
        userId: session.user.id,
        courseId,
        lessonId: { in: allLessonIds },
        completed: true,
      },
    });

    if (completedProgress.length !== allLessonIds.length) {
      return NextResponse.json(
        { error: 'Morate završiti sve lekcije prije recenziranja tečaja' },
        { status: 400 }
      );
    }

    // Handle photo upload if provided
    let photoUrl: string | null = null;
    if (photo && photo.size > 0) {
      // Validate photo
      if (!photo.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Datoteka mora biti slika' },
          { status: 400 }
        );
      }

      if (photo.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Slika ne smije biti veća od 5MB' },
          { status: 400 }
        );
      }

      // Upload to S3
      const buffer = Buffer.from(await photo.arrayBuffer());
      const timestamp = Date.now();
      const extension = photo.name.split('.').pop();
      const s3Key = `review-photos/${courseId}/${session.user.id}/${timestamp}.${extension}`;
      
      await uploadToS3(buffer, s3Key, photo.type);
      photoUrl = getPublicUrl(s3Key);
    }

    // Check if user already has a review for this course
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        courseId,
        targetType: 'COURSE',
      },
    });

    let review;
    if (existingReview) {
      // Update existing review
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          comment: comment || null,
          ...(photoUrl && { photoUrl }),
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
        },
      });
    } else {
      // Create new review
      review = await prisma.review.create({
        data: {
          userId: session.user.id,
          courseId,
          targetType: 'COURSE',
          rating,
          comment: comment || null,
          photoUrl,
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
        },
      });
    }

    return NextResponse.json({
      success: true,
      review,
      message: existingReview ? 'Recenzija je uspješno ažurirana' : 'Recenzija je uspješno dodana',
    });
  } catch (error) {
    console.error('Error creating/updating review:', error);
    return NextResponse.json(
      { error: 'Greška pri spremanju recenzije' },
      { status: 500 }
    );
  }
}
