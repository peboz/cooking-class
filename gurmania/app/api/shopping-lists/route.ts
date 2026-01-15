import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { lessonId, title } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Nedostaje lessonId parametar' },
        { status: 400 }
      );
    }

    // Fetch lesson with ingredients
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        module: {
          include: {
            course: {
              select: {
                title: true,
              },
            },
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

    if (lesson.ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Ova lekcija nema sastojaka' },
        { status: 400 }
      );
    }

    // Create shopping list
    const shoppingList = await prisma.shoppingList.create({
      data: {
        userId: session.user.id,
        title: title || `${lesson.module.course.title} - ${lesson.title}`,
        items: {
          create: lesson.ingredients.map(lessonIngredient => ({
            ingredientId: lessonIngredient.ingredientId,
            quantity: lessonIngredient.quantity,
            unit: lessonIngredient.unit,
            purchased: false,
          })),
        },
      },
      include: {
        items: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      shoppingList: {
        id: shoppingList.id,
        title: shoppingList.title,
        items: shoppingList.items,
        createdAt: shoppingList.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating shopping list:', error);
    return NextResponse.json(
      { error: 'Greška pri stvaranju liste za kupovinu' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const shoppingLists = await prisma.shoppingList.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      lists: shoppingLists.map(list => ({
        id: list.id,
        title: list.title,
        items: list.items.map(item => ({
          id: item.id,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          unit: item.unit,
          purchased: item.purchased,
          ingredient: {
            name: item.ingredient.name,
          },
        })),
        createdAt: list.createdAt,
        totalItems: list.items.length,
        purchasedItems: list.items.filter(item => item.purchased).length,
      })),
    });
  } catch (error) {
    console.error('Error fetching shopping lists:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju lista za kupovinu' },
      { status: 500 }
    );
  }
}
