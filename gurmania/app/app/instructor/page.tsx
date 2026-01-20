import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { redirect } from "next/navigation";

export default async function InstructorDashboard() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const instructorId = session.user.id;

  // Fetch all stats in parallel
  const [courseCount, workshopCount, uniqueStudents, reviews, recentEnrollments, recentReviews] = await Promise.all([
    prisma.course.count({
      where: {
        instructorId,
        deletedAt: null,
      },
    }),
    prisma.workshop.count({
      where: {
        instructorId,
      },
    }),
    prisma.progress.findMany({
      where: {
        course: {
          instructorId,
        },
      },
      distinct: ['userId'],
      select: {
        userId: true,
      },
    }),
    prisma.review.findMany({
      where: {
        course: {
          instructorId,
        },
        targetType: 'COURSE',
      },
      select: {
        rating: true,
      },
    }),
    // Recent enrollments
    prisma.progress.findMany({
      where: {
        course: {
          instructorId,
        },
      },
      select: {
        id: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
    }),
    // Recent reviews
    prisma.review.findMany({
      where: {
        course: {
          instructorId,
        },
        targetType: 'COURSE',
      },
      select: {
        id: true,
        rating: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    }),
  ]);

  const studentCount = uniqueStudents.length;
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : null;

  // Combine and sort recent activities
  type Activity = {
    id: string;
    type: 'enrollment' | 'review';
    userName: string | null;
    courseTitle: string;
    rating?: number;
    timestamp: Date;
  };

  const activities: Activity[] = [
    ...recentEnrollments.map((enrollment) => ({
      id: `enrollment-${enrollment.id}`,
      type: 'enrollment' as const,
      userName: enrollment.user.name,
      courseTitle: enrollment.course.title,
      timestamp: enrollment.updatedAt,
    })),
    ...recentReviews.map((review) => ({
      id: `review-${review.id}`,
      type: 'review' as const,
      userName: review.user.name,
      courseTitle: review.course.title,
      rating: review.rating,
      timestamp: review.createdAt,
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  // Helper function to format relative time
  function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'upravo sad';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `prije ${minutes} ${minutes === 1 ? 'minutu' : minutes < 5 ? 'minute' : 'minuta'}`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `prije ${hours} ${hours === 1 ? 'sat' : hours < 5 ? 'sata' : 'sati'}`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return `prije ${days} ${days === 1 ? 'dan' : 'dana'}`;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Dobrodošli u instruktorski panel platforme Gurmania.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Tečajevi</h3>
            <div className="text-2xl font-bold">{courseCount}</div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Radionice</h3>
            <div className="text-2xl font-bold">{workshopCount}</div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Polaznici</h3>
            <div className="text-2xl font-bold">{studentCount}</div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Prosječna ocjena</h3>
            <div className="text-2xl font-bold">
              {avgRating !== null ? avgRating.toFixed(1) : '-'}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Nedavna aktivnost</h3>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nema nedavnih aktivnosti.
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex-1">
                  <p className="text-sm">
                    {activity.type === 'enrollment' ? (
                      <>
                        <span className="font-medium">{activity.userName}</span> se
                        upisao na tečaj{' '}
                        <span className="font-medium">{activity.courseTitle}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium">{activity.userName}</span>{' '}
                        ocijenio tečaj{' '}
                        <span className="font-medium">{activity.courseTitle}</span> s
                        ocjenom {activity.rating}/5
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
