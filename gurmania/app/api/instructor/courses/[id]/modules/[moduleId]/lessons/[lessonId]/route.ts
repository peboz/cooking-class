import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { isValidYouTubeUrl } from '@/lib/video';

type RouteContext = {
  params: Promise<{
    id: string;
    moduleId: string;
    lessonId: string;
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

    const { lessonId } = await context.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lekcija nije pronađena' },
        { status: 404 }
      );
    }

    // Check ownership (unless admin)
    if (session.user.role !== 'ADMIN' && lesson.module.course.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nemate ovlasti za pristup ovoj lekciji' },
        { status: 403 }
      );
    }

    return NextResponse.json({ lesson }, { status: 200 });
  } catch (error) {
    console.error('Get lesson error:', error);
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

    const { lessonId } = await context.params;

    // Check if lesson exists
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Lekcija nije pronađena' },
        { status: 404 }
      );
    }

    // Check ownership (unless admin)
    if (session.user.role !== 'ADMIN' && existingLesson.module.course.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nemate ovlasti za uređivanje ove lekcije' },
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
    if (title !== undefined && (!title || title.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Naziv lekcije je obavezan' },
        { status: 400 }
      );
    }

    // Validate YouTube URL if provided
    if (videoUrl !== undefined && videoUrl && videoUrl.trim().length > 0 && !isValidYouTubeUrl(videoUrl)) {
      return NextResponse.json(
        { error: 'Nevažeći YouTube URL' },
        { status: 400 }
      );
    }

    // Update lesson with ingredients in transaction
    const updatedLesson = await prisma.$transaction(async (tx) => {
      // Update lesson
      const updateData: Record<string, string | string[] | number | boolean | null> = {};
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (videoUrl !== undefined) updateData.videoUrl = videoUrl?.trim() || null;
      if (steps !== undefined) updateData.steps = steps;
      if (prepTimeMin !== undefined) updateData.prepTimeMin = prepTimeMin;
      if (cookTimeMin !== undefined) updateData.cookTimeMin = cookTimeMin;
      if (difficulty !== undefined) updateData.difficulty = difficulty;
      if (cuisineType !== undefined) updateData.cuisineType = cuisineType;
      if (allergenTags !== undefined) updateData.allergenTags = allergenTags;
      if (published !== undefined) updateData.published = published;

      const lesson = await tx.lesson.update({
        where: { id: lessonId },
        data: updateData,
      });

      // If ingredients provided, delete old ones and create new ones
      if (ingredients !== undefined && Array.isArray(ingredients)) {
        // Delete old lesson-ingredient links
        await tx.lessonIngredient.deleteMany({
          where: { lessonId },
        });

        // Create new ingredients
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
              lessonId,
              ingredientId: ingredient.id,
              quantity: ing.quantity || null,
              unit: ing.unit || null,
              optional: ing.optional || false,
            },
          });
        }
      }

      return lesson;
    });

    return NextResponse.json(
      { message: 'Lekcija uspješno ažurirana', lesson: updatedLesson },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update lesson error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom ažuriranja lekcije' },
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

    const { lessonId } = await context.params;

    // Check if lesson exists
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Lekcija nije pronađena' },
        { status: 404 }
      );
    }

    // Check ownership (unless admin)
    if (session.user.role !== 'ADMIN' && existingLesson.module.course.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nemate ovlasti za brisanje ove lekcije' },
        { status: 403 }
      );
    }

    // Delete lesson (cascade will handle ingredients)
    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    return NextResponse.json(
      { message: 'Lekcija uspješno obrisana' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete lesson error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom brisanja lekcije' },
      { status: 500 }
    );
  }
}
