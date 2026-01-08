import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { uploadToS3, generateProfilePictureKey, getPublicUrl, deleteFromS3 } from '@/lib/s3';

// Max file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
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
        { error: 'Nevažeći tip datoteke. Dozvoljeni su JPG, PNG, GIF i WebP.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Datoteka je prevelika. Maksimalna veličina je 2MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate S3 key
    const s3Key = generateProfilePictureKey(session.user.id, file.name);

    // Upload to S3
    await uploadToS3(buffer, s3Key, file.type);

    // Get public URL
    const imageUrl = getPublicUrl(s3Key);

    // Get current user to check if they have an old image
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });

    // Delete old image from S3 if exists and is from our bucket
    if (user?.image && user.image.includes(process.env.NEXT_PUBLIC_AWS_S3_BUCKET_URL!)) {
      try {
        const oldKey = user.image.split('/').slice(-3).join('/'); // Extract key from URL
        await deleteFromS3(oldKey);
      } catch (err) {
        console.error('Error deleting old image:', err);
        // Continue even if deletion fails
      }
    }

    // Update user image in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    });

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Greška pri uploadu slike' },
      { status: 500 }
    );
  }
}
