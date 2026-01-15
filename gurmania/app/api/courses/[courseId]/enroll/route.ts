import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

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

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
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
        { error: 'Tečaj nije dostupan' },
        { status: 403 }
      );
    }

    // Check if user is already enrolled
    const existingProgress = await prisma.progress.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseId,
      },
    });

    if (existingProgress) {
      return NextResponse.json(
        { message: 'Već ste upisani na ovaj tečaj', enrolled: true },
        { status: 200 }
      );
    }

    // Create a progress entry for the course (enrollment)
    await prisma.progress.create({
      data: {
        userId: session.user.id,
        courseId: courseId,
        completed: false,
        percent: 0,
        timeSpentSec: 0,
      },
    });

    return NextResponse.json(
      { message: 'Uspješno ste se upisali na tečaj', enrolled: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json(
      { error: 'Greška pri upisu na tečaj' },
      { status: 500 }
    );
  }
}
