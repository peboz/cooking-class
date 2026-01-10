import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
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
    const { title, description } = body;

    // Validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Naziv modula je obavezan' },
        { status: 400 }
      );
    }

    // Get the max order value to append new module at the end
    const maxOrderModule = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    });

    const nextOrder = maxOrderModule ? maxOrderModule.order + 1 : 0;

    // Create module
    const newModule = await prisma.module.create({
      data: {
        courseId,
        title: title.trim(),
        description: description?.trim() || null,
        order: nextOrder,
      },
    });

    return NextResponse.json(
      { message: 'Modul uspješno kreiran', module: newModule },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create module error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom kreiranja modula' },
      { status: 500 }
    );
  }
}
