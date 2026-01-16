import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Collect all user data from different tables
    const [
      user,
      studentProfile,
      instructorProfile,
      courses,
      workshops,
      reviews,
      reservations,
      progress,
      certificates,
      quizSubmissions,
      comments,
      commentReplies,
      shoppingLists,
      following,
      followers,
      notifications,
      auditLogs,
    ] = await Promise.all([
      // Basic user data
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      // Student profile
      prisma.studentProfile.findUnique({
        where: { userId },
        select: {
          skillLevel: true,
          dietaryPreferences: true,
          allergies: true,
          favoriteCuisines: true,
          notes: true,
        },
      }),

      // Instructor profile
      prisma.instructorProfile.findUnique({
        where: { userId },
        select: {
          bio: true,
          specializations: true,
          verified: true,
          verificationStatus: true,
          verificationReason: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      // Courses created (for instructors)
      prisma.course.findMany({
        where: { instructorId: userId },
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          cuisineType: true,
          tags: true,
          published: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      // Workshops created
      prisma.workshop.findMany({
        where: { instructorId: userId },
        select: {
          id: true,
          title: true,
          description: true,
          startTime: true,
          durationMin: true,
          capacity: true,
          skillLevel: true,
          prerequisites: true,
        },
      }),

      // Reviews written
      prisma.review.findMany({
        where: { userId },
        select: {
          id: true,
          targetType: true,
          lessonId: true,
          courseId: true,
          instructorId: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      }),

      // Workshop reservations
      prisma.reservation.findMany({
        where: { userId },
        select: {
          id: true,
          workshopId: true,
          status: true,
          createdAt: true,
          workshop: {
            select: {
              title: true,
              startTime: true,
            },
          },
        },
      }),

      // Course/Lesson progress
      prisma.progress.findMany({
        where: { userId },
        select: {
          id: true,
          courseId: true,
          lessonId: true,
          completed: true,
          percent: true,
          timeSpentSec: true,
          lastAccessedAt: true,
          updatedAt: true,
        },
      }),

      // Certificates earned
      prisma.certificate.findMany({
        where: { userId },
        select: {
          id: true,
          courseId: true,
          issuedAt: true,
          pdfUrl: true,
          course: {
            select: {
              title: true,
            },
          },
        },
      }),

      // Quiz submissions
      prisma.quizSubmission.findMany({
        where: { userId },
        select: {
          id: true,
          quizId: true,
          score: true,
          submittedAt: true,
          quiz: {
            select: {
              title: true,
              lesson: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      }),

      // Comments posted
      prisma.comment.findMany({
        where: { userId },
        select: {
          id: true,
          lessonId: true,
          content: true,
          isQuestion: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lesson: {
            select: {
              title: true,
            },
          },
        },
      }),

      // Comment replies posted
      prisma.commentReply.findMany({
        where: { userId },
        select: {
          id: true,
          commentId: true,
          content: true,
          createdAt: true,
        },
      }),

      // Shopping lists
      prisma.shoppingList.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              quantity: true,
              unit: true,
              purchased: true,
              ingredient: {
                select: {
                  name: true,
                  allergenFlags: true,
                },
              },
            },
          },
        },
      }),

      // Instructors followed
      prisma.instructorFollow.findMany({
        where: { studentId: userId },
        select: {
          createdAt: true,
          instructor: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),

      // Followers (if instructor)
      prisma.instructorFollow.findMany({
        where: { instructorId: userId },
        select: {
          createdAt: true,
          student: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),

      // Notifications
      prisma.notification.findMany({
        where: { userId },
        select: {
          type: true,
          title: true,
          message: true,
          read: true,
          sentAt: true,
          scheduledFor: true,
        },
      }),

      // Audit logs
      prisma.auditLog.findMany({
        where: { userId },
        select: {
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          ipAddress: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100, // Limit to last 100 audit logs
      }),
    ]);

    // Compile all data into a structured export
    const exportData = {
      exportDate: new Date().toISOString(),
      exportInfo: {
        platform: 'Gurmania',
        description: 'Izvoz vaših osobnih podataka u skladu s GDPR-om',
        format: 'JSON',
      },
      userData: {
        account: user,
        profiles: {
          student: studentProfile,
          instructor: instructorProfile,
        },
      },
      content: {
        coursesCreated: courses,
        workshopsCreated: workshops,
        reviews: reviews,
        comments: comments,
        commentReplies: commentReplies,
      },
      learning: {
        progress: progress,
        certificates: certificates,
        quizSubmissions: quizSubmissions,
      },
      social: {
        following: following,
        followers: followers,
      },
      personal: {
        shoppingLists: shoppingLists,
        reservations: reservations,
        notifications: notifications,
      },
      activityLog: {
        description: 'Posljednjih 100 aktivnosti',
        logs: auditLogs,
      },
      stats: {
        totalCourses: courses.length,
        totalReviews: reviews.length,
        totalComments: comments.length + commentReplies.length,
        totalProgress: progress.length,
        totalCertificates: certificates.length,
        totalFollowing: following.length,
        totalFollowers: followers.length,
      },
    };

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `gurmania-data-export-${timestamp}.json`;

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom izvoza podataka' },
      { status: 500 }
    );
  }
}
