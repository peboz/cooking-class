import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { deleteFromS3 } from '@/lib/s3';

// DELETE - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; reviewId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const { courseId, reviewId } = await params;

    // Find the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Recenzija nije pronađena' },
        { status: 404 }
      );
    }

    // Verify the review belongs to this course
    if (review.courseId !== courseId) {
      return NextResponse.json(
        { error: 'Recenzija ne pripada ovom tečaju' },
        { status: 400 }
      );
    }

    // Only the review owner or admin can delete
    const isOwner = review.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Nemate dozvolu za brisanje ove recenzije' },
        { status: 403 }
      );
    }

    // Delete photo from S3 if it exists
    if (review.photoUrl) {
      try {
        // Extract S3 key from URL
        const url = new URL(review.photoUrl);
        const key = url.pathname.substring(1); // Remove leading slash
        await deleteFromS3(key);
      } catch (error) {
        console.error('Error deleting photo from S3:', error);
        // Continue with review deletion even if photo deletion fails
      }
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({
      success: true,
      message: 'Recenzija je uspješno obrisana',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju recenzije' },
      { status: 500 }
    );
  }
}
