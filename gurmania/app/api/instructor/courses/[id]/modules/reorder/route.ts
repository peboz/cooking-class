import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

type RouteContext = {
  params: Promise<{
    id: string;
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

    const { id: courseId } = await context.params;

    // Check if course exists and user has permission
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Tečaj nije pronađen' },
        { status: 404 }
      );
    }

    // Check ownership (unless admin)
    if (session.user.role !== 'ADMIN' && course.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nemate ovlasti za uređivanje ovog tečaja' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { modules } = body;

    // Validation
    if (!Array.isArray(modules)) {
      return NextResponse.json(
        { error: 'Nevažeći format podataka' },
        { status: 400 }
      );
    }

    // Update all module orders in a transaction
    await prisma.$transaction(
      modules.map((module: { id: string; order: number }) =>
        prisma.module.update({
          where: { id: module.id },
          data: { order: module.order },
        })
      )
    );

    return NextResponse.json(
      { message: 'Redoslijed modula uspješno ažuriran' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reorder modules error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom ažuriranja redoslijeda' },
      { status: 500 }
    );
  }
}
