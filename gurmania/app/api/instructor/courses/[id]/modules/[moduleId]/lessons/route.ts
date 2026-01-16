import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { isValidYouTubeUrl } from '@/lib/video';

type RouteContext = {
  params: Promise<{
    id: string;
    moduleId: string;
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
    const {
      title,
      description,
      videoUrl,
      steps,
      prepTimeMin,
      cookTimeMin,
      difficulty,
      cuisineType,
      allergenTags,
      ingredients,
      published,
    } = body;

    // Validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Naziv lekcije je obavezan' },
        { status: 400 }
      );
    }

    // Validate YouTube URL if provided
    if (videoUrl && videoUrl.trim().length > 0 && !isValidYouTubeUrl(videoUrl)) {
      return NextResponse.json(
        { error: 'Nevažeći YouTube URL' },
        { status: 400 }
      );
    }

    // Get the max order value to append new lesson at the end
    const maxOrderLesson = await prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' },
    });

    const nextOrder = maxOrderLesson ? maxOrderLesson.order + 1 : 0;

    // Create lesson with ingredients in transaction
    const lesson = await prisma.$transaction(
      async (tx) => {
        // Create lesson
        const newLesson = await tx.lesson.create({
        data: {
          moduleId,
          title: title.trim(),
          description: description?.trim() || null,
          videoUrl: videoUrl?.trim() || null,
          steps: steps || null,
          prepTimeMin: prepTimeMin || null,
          cookTimeMin: cookTimeMin || null,
          difficulty: difficulty || 'EASY',
          cuisineType: cuisineType || null,
          allergenTags: allergenTags || [],
          order: nextOrder,
          published: published || false,
        },
      });

      // Create ingredients if provided
      if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
        for (const ing of ingredients) {
          // Create ingredient first
          const ingredient = await tx.ingredient.create({
            data: {
              name: ing.name,
              baseUnit: ing.unit || null,
              allergenFlags: ing.allergenFlags || [],
            },
          });

          // Link to lesson
          await tx.lessonIngredient.create({
            data: {
              lessonId: newLesson.id,
              ingredientId: ingredient.id,
              quantity: ing.quantity || null,
              unit: ing.unit || null,
              optional: ing.optional || false,
            },
          });
        }
      }

      return newLesson;
    },
    {
      maxWait: 10000, // 10 seconds
      timeout: 20000, // 20 seconds
    }
  );

    return NextResponse.json(
      { message: 'Lekcija uspješno kreirana', lesson },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create lesson error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom kreiranja lekcije' },
      { status: 500 }
    );
  }
}
