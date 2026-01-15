import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

/**
 * Upload file to S3
 * @param file File buffer
 * @param key S3 key (path/filename)
 * @param contentType MIME type
 * @returns S3 key
 */
export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return key;
}

/**
 * Delete file from S3
 * @param key S3 key (path/filename)
 */
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Get public URL for S3 object
 * @param key S3 key
 * @returns Public URL
 */
export function getPublicUrl(key: string): string {
  const bucketUrl = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_URL!;
  return `${bucketUrl}/${key}`;
}

/**
 * Get signed URL for private S3 object (expires in 1 hour)
 * @param key S3 key
 * @returns Signed URL
 */
export async function getSignedUrlForObject(key: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
}

/**
 * Generate unique S3 key for user profile picture
 * @param userId User ID
 * @param filename Original filename
 * @returns S3 key
 */
export function generateProfilePictureKey(userId: string, filename: string): string {
  const timestamp = Date.now();
  const extension = filename.split('.').pop();
  return `profile-pictures/${userId}/${timestamp}.${extension}`;
}

/**
 * Generate unique S3 key for course thumbnail
 * @param courseId Course ID
 * @param filename Original filename
 * @returns S3 key
 */
export function generateCourseThumbnailKey(courseId: string, filename: string): string {
  const timestamp = Date.now();
  const extension = filename.split('.').pop();
  return `course-thumbnails/${courseId}/${timestamp}.${extension}`;
}

/**
 * Generate unique S3 key for lesson media (future use)
 * @param lessonId Lesson ID
 * @param filename Original filename
 * @returns S3 key
 */
export function generateLessonMediaKey(lessonId: string, filename: string): string {
  const timestamp = Date.now();
  const extension = filename.split('.').pop();
  return `lesson-media/${lessonId}/${timestamp}.${extension}`;
}
