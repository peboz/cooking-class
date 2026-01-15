import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadToS3, generateProfilePictureKey, getPublicUrl } from '@/lib/s3';

// Max file size: 5MB for documents
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types for ID documents
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

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
        { error: 'Nevažeći tip datoteke. Dozvoljeni su JPG, PNG, WebP i PDF.' },
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

    // Generate S3 key for verification documents
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const s3Key = `verification-documents/${session.user.id}/${timestamp}.${extension}`;

    // Upload to S3
    await uploadToS3(buffer, s3Key, file.type);

    // Get public URL
    const documentUrl = getPublicUrl(s3Key);

    return NextResponse.json({
      success: true,
      documentUrl,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Greška pri uploadu dokumenta' },
      { status: 500 }
    );
  }
}
