import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { generateAndUploadCertificate } from '@/lib/certificate';
import { sendCertificateEmail } from '@/lib/email';

// POST - Generate and issue a certificate for a completed course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const { courseId } = await params;

    // Check if user already has a certificate for this course
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        userId: session.user.id,
        courseId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    // If certificate exists AND has a PDF URL, return it
    if (existingCertificate && existingCertificate.pdfUrl) {
      return NextResponse.json({
        id: existingCertificate.id,
        pdfUrl: existingCertificate.pdfUrl,
        issuedAt: existingCertificate.issuedAt.toISOString(),
        message: 'Certifikat već postoji',
      });
    }

    // Get course details and verify completion
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            name: true,
          },
        },
        modules: {
          include: {
            lessons: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Tečaj nije pronađen' },
        { status: 404 }
      );
    }

    // Get all lesson IDs
    const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));

    if (allLessonIds.length === 0) {
      return NextResponse.json(
        { error: 'Tečaj nema lekcija' },
        { status: 400 }
      );
    }

    // Check if all lessons are completed
    const completedLessons = await prisma.progress.findMany({
      where: {
        userId: session.user.id,
        courseId,
        lessonId: { in: allLessonIds },
        completed: true,
      },
    });

    if (completedLessons.length !== allLessonIds.length) {
      return NextResponse.json(
        { 
          error: 'Morate završiti sve lekcije prije dobivanja certifikata',
          completed: completedLessons.length,
          total: allLessonIds.length,
        },
        { status: 400 }
      );
    }

    // Create certificate record first to get ID (or use existing one if it exists without PDF)
    let certificate;
    if (existingCertificate && !existingCertificate.pdfUrl) {
      certificate = existingCertificate;
    } else {
      certificate = await prisma.certificate.create({
        data: {
          userId: session.user.id,
          courseId,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          course: {
            select: {
              title: true,
            },
          },
        },
      });
    }

    // Generate PDF certificate
    const result = await generateAndUploadCertificate(
      certificate.id,
      certificate.user.name || session.user.email || 'Korisnik',
      certificate.course.title,
      course.instructor.name || 'Instruktor',
      certificate.issuedAt
    );

    // Update certificate with PDF URL
    const updatedCertificate = await prisma.certificate.update({
      where: { id: certificate.id },
      data: { pdfUrl: result.pdfUrl },
      include: {
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    // Send certificate via email
    if (certificate.user.email) {
      try {
        await sendCertificateEmail(
          certificate.user.email,
          certificate.user.name || 'Korisnik',
          certificate.course.title,
          result.pdfUrl
        );
      } catch (emailError) {
        console.error('Failed to send certificate email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      id: updatedCertificate.id,
      pdfUrl: updatedCertificate.pdfUrl,
      issuedAt: updatedCertificate.issuedAt.toISOString(),
      message: 'Certifikat uspješno generiran i poslan na email',
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json(
      { error: 'Greška pri generiranju certifikata' },
      { status: 500 }
    );
  }
}

// GET - Get certificate for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const { courseId } = await params;

    const certificate = await prisma.certificate.findFirst({
      where: {
        userId: session.user.id,
        courseId,
      },
      include: {
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certifikat nije pronađen', hasCertificate: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: certificate.id,
      pdfUrl: certificate.pdfUrl,
      issuedAt: certificate.issuedAt.toISOString(),
      hasCertificate: true,
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju certifikata' },
      { status: 500 }
    );
  }
}
