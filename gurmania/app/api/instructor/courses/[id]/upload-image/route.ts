import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { uploadToS3, generateCourseThumbnailKey, getPublicUrl, deleteFromS3 } from '@/lib/s3';

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

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

    const { id } = await context.params;

    // Check if course exists and user has permission
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
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
        { error: 'Nemate ovlasti za uređivanje ovog tečaja' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nema datoteke' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Nevažeći tip datoteke. Dozvoljeni su JPG, PNG i WebP.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Datoteka je prevelika. Maksimalna veličina je 5MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate S3 key
    const s3Key = generateCourseThumbnailKey(id, file.name);

    // Upload to S3
    await uploadToS3(buffer, s3Key, file.type);

    // Get public URL
    const imageUrl = getPublicUrl(s3Key);

    // Delete old image from S3 if exists and is from our bucket
    if (course.media && course.media.length > 0) {
      // Find course thumbnail media
      const oldMedia = await prisma.media.findFirst({
        where: {
          courseId: id,
          type: 'IMAGE',
        },
      });

      if (oldMedia?.url && oldMedia.url.includes(process.env.NEXT_PUBLIC_AWS_S3_BUCKET_URL!)) {
        try {
          const oldKey = oldMedia.url.split('/').slice(-3).join('/');
          await deleteFromS3(oldKey);
          // Delete media record
          await prisma.media.delete({
            where: { id: oldMedia.id },
          });
        } catch (err) {
          console.error('Error deleting old image:', err);
          // Continue even if deletion fails
        }
      }
    }

    // Create media record
    await prisma.media.create({
      data: {
        url: imageUrl,
        type: 'IMAGE',
        filename: file.name,
        courseId: id,
      },
    });

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error('Error uploading course image:', error);
    return NextResponse.json(
      { error: 'Greška pri uploadu slike' },
      { status: 500 }
    );
  }
}
