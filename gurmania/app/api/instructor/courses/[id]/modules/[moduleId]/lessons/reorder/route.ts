import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

type RouteContext = {
  params: Promise<{
    id: string;
    moduleId: string;
  }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const { id: courseId, moduleId } = await context.params;

    // Check if module exists and belongs to course
    const moduleData = await prisma.module.findFirst({
      where: {
        id: moduleId,
        courseId,
      },
      include: {
        course: true,
      },
    });

    if (!moduleData) {
      return NextResponse.json(
        { error: 'Modul nije pronađen' },
        { status: 404 }
      );
    }

    // Check ownership (unless admin)
    if (session.user.role !== 'ADMIN' && moduleData.course.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nemate ovlasti za uređivanje ovog modula' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { lessons } = body;

    // Validation
    if (!Array.isArray(lessons)) {
      return NextResponse.json(
        { error: 'Nevažeći format podataka' },
        { status: 400 }
      );
    }

    // Update all lesson orders in a transaction
    await prisma.$transaction(
      lessons.map((lesson: { id: string; order: number }) =>
        prisma.lesson.update({
          where: { id: lesson.id },
          data: { order: lesson.order },
        })
      )
    );

    return NextResponse.json(
      { message: 'Redoslijed lekcija uspješno ažuriran' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reorder lessons error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom ažuriranja redoslijeda' },
      { status: 500 }
    );
  }
}
