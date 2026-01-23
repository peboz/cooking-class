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

    // Find or create user's master shopping list
    let shoppingList = await prisma.shoppingList.findFirst({
      where: { userId: session.user.id },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!shoppingList) {
      // Create new master shopping list
      shoppingList = await prisma.shoppingList.create({
        data: {
          userId: session.user.id,
          title: 'Moja kupovna lista',
        },
        include: {
          items: {
            include: {
              ingredient: true,
            },
          },
        },
      });
    }

    // Add ingredients to the shopping list
    for (const lessonIngredient of lesson.ingredients) {
      // Check if item already exists in the database
      const existingItem = await prisma.shoppingListItem.findUnique({
        where: {
          shoppingListId_ingredientId: {
            shoppingListId: shoppingList.id,
            ingredientId: lessonIngredient.ingredientId,
          },
        },
      });

      if (existingItem) {
        // If same unit or both null, add quantities together
        if (existingItem.unit === lessonIngredient.unit) {
          const newQuantity = (existingItem.quantity || 0) + (lessonIngredient.quantity || 0);
          await prisma.shoppingListItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQuantity },
          });
        } else {
          // Different units - update to the new unit and quantity
          // (since schema doesn't allow multiple entries for same ingredient)
          await prisma.shoppingListItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: lessonIngredient.quantity,
              unit: lessonIngredient.unit,
            },
          });
        }
      } else {
        // Create new item
        await prisma.shoppingListItem.create({
          data: {
            shoppingListId: shoppingList.id,
            ingredientId: lessonIngredient.ingredientId,
            quantity: lessonIngredient.quantity,
            unit: lessonIngredient.unit,
            purchased: false,
          },
        });
      }
    }

    // Link the lesson to the shopping list (many-to-many relation)
    await prisma.shoppingList.update({
      where: { id: shoppingList.id },
      data: {
        lessons: {
          connect: { id: lessonId },
        },
      },
    });

    // Fetch updated shopping list
    const updatedShoppingList = await prisma.shoppingList.findUnique({
      where: { id: shoppingList.id },
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
        id: updatedShoppingList!.id,
        title: updatedShoppingList!.title,
        items: updatedShoppingList!.items,
        createdAt: updatedShoppingList!.createdAt,
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
        lessons: {
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
        lessons: list.lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          courseTitle: lesson.module.course.title,
          ingredients: lesson.ingredients.map(li => ({
            ingredientId: li.ingredientId,
            name: li.ingredient.name,
            quantity: li.quantity,
            unit: li.unit,
          })),
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
