import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const { itemId } = await params;
    const body = await request.json();
    const { purchased } = body;

    // Verify the item belongs to the user
    const item = await prisma.shoppingListItem.findUnique({
      where: { id: itemId },
      include: {
        shoppingList: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Stavka nije pronađena' },
        { status: 404 }
      );
    }

    if (item.shoppingList.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nemate ovlasti za uređivanje ove stavke' },
        { status: 403 }
      );
    }

    // Update the item
    const updatedItem = await prisma.shoppingListItem.update({
      where: { id: itemId },
      data: { purchased },
      include: {
        ingredient: true,
      },
    });

    return NextResponse.json({
      success: true,
      item: updatedItem,
    });
  } catch (error) {
    console.error('Error updating shopping list item:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju stavke' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const { itemId } = await params;

    // Verify the item belongs to the user
    const item = await prisma.shoppingListItem.findUnique({
      where: { id: itemId },
      include: {
        shoppingList: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Stavka nije pronađena' },
        { status: 404 }
      );
    }

    if (item.shoppingList.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nemate ovlasti za brisanje ove stavke' },
        { status: 403 }
      );
    }

    // Delete the item
    await prisma.shoppingListItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({
      success: true,
      message: 'Stavka uspješno obrisana',
    });
  } catch (error) {
    console.error('Error deleting shopping list item:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju stavke' },
      { status: 500 }
    );
  }
}
