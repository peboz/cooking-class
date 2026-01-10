import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
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

    const { id } = await context.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        modules: {
          include: {
            lessons: {
              include: {
                ingredients: {
                  include: {
                    ingredient: true,
                  },
                },
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
      },
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
        { error: 'Nemate ovlasti za pristup ovom tečaju' },
        { status: 403 }
      );
    }

    return NextResponse.json({ course }, { status: 200 });
  } catch (error) {
    console.error('Get course error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške' },
      { status: 500 }
    );
  }
}

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

    const { id } = await context.params;
    const body = await request.json();

    // Check if course exists and user has permission
    const existingCourse = await prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Tečaj nije pronađen' },
        { status: 404 }
      );
    }

    // Check ownership (unless admin)
    if (session.user.role !== 'ADMIN' && existingCourse.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nemate ovlasti za uređivanje ovog tečaja' },
        { status: 403 }
      );
    }

    const { title, description, difficulty, cuisineType, tags, published } = body;

    // Validation
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Naziv tečaja je obavezan' },
          { status: 400 }
        );
      }
      if (title.length > 200) {
        return NextResponse.json(
          { error: 'Naziv tečaja može imati maksimalno 200 znakova' },
          { status: 400 }
        );
      }
    }

    // Update course
    const updateData: Record<string, string | string[] | boolean | null> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (cuisineType !== undefined) updateData.cuisineType = cuisineType;
    if (tags !== undefined) updateData.tags = tags;
    if (published !== undefined) updateData.published = published;

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
    });

    // Create audit log for publish/unpublish
    if (published !== undefined && published !== existingCourse.published) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: published ? 'PUBLISH_COURSE' : 'UNPUBLISH_COURSE',
          entityType: 'Course',
          entityId: id,
          metadata: {
            title: updatedCourse.title,
          },
        },
      });
    }

    return NextResponse.json(
      { message: 'Tečaj uspješno ažuriran', course: updatedCourse },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update course error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom ažuriranja tečaja' },
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

    const { id } = await context.params;

    // Check if course exists and user has permission
    const existingCourse = await prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Tečaj nije pronađen' },
        { status: 404 }
      );
    }

    // Check ownership (unless admin)
    if (session.user.role !== 'ADMIN' && existingCourse.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nemate ovlasti za brisanje ovog tečaja' },
        { status: 403 }
      );
    }

    // Delete course (cascade will handle modules and lessons)
    await prisma.course.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE_COURSE',
        entityType: 'Course',
        entityId: id,
        metadata: {
          title: existingCourse.title,
        },
      },
    });

    return NextResponse.json(
      { message: 'Tečaj uspješno obrisan' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete course error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom brisanja tečaja' },
      { status: 500 }
    );
  }
}
