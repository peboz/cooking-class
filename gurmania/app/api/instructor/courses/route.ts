import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    // Check if user is instructor or admin
    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nemate ovlasti za pristup ovom resursu' },
        { status: 403 }
      );
    }

    // Get all courses for this instructor (or all if admin)
    const where = session.user.role === 'ADMIN' 
      ? {} 
      : { instructorId: session.user.id };

    const courses = await prisma.course.findMany({
      where,
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
            lessons: true,
          },
        },
        media: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Add counts for modules and lessons
    const coursesWithCounts = courses.map(course => ({
      ...course,
      moduleCount: course.modules.length,
      lessonCount: course.modules.reduce((acc, module) => acc + module.lessons.length, 0),
    }));

    return NextResponse.json({ courses: coursesWithCounts }, { status: 200 });
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    // Check if user is instructor or admin
    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nemate ovlasti za kreiranje tečaja' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, difficulty, cuisineType, tags } = body;

    // Validation
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

    // Create course
    const course = await prisma.course.create({
      data: {
        instructorId: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        difficulty: difficulty || 'EASY',
        cuisineType: cuisineType || null,
        tags: tags || [],
        published: false,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_COURSE',
        entityType: 'Course',
        entityId: course.id,
        metadata: {
          title: course.title,
          difficulty: course.difficulty,
        },
      },
    });

    return NextResponse.json(
      { message: 'Tečaj uspješno kreiran', course },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom kreiranja tečaja' },
      { status: 500 }
    );
  }
}
