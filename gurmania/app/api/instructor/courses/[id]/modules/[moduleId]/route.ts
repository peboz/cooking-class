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
    const { title, description } = body;

    // Validation
    if (title !== undefined && (!title || title.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Naziv modula je obavezan' },
        { status: 400 }
      );
    }

    // Update module
    const updateData: Record<string, string | null> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;

    const updatedModule = await prisma.module.update({
      where: { id: moduleId },
      data: updateData,
    });

    return NextResponse.json(
      { message: 'Modul uspješno ažuriran', module: updatedModule },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update module error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom ažuriranja modula' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        { error: 'Nemate ovlasti za brisanje ovog modula' },
        { status: 403 }
      );
    }

    // Delete module (cascade will handle lessons)
    await prisma.module.delete({
      where: { id: moduleId },
    });

    return NextResponse.json(
      { message: 'Modul uspješno obrisan' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete module error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom brisanja modula' },
      { status: 500 }
    );
  }
}
