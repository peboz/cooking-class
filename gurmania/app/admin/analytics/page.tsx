import { prisma } from "@/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, BookOpen, Video, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function toPercent(value: number, total: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export default async function AdminAnalyticsPage() {
  const now = new Date();
  const last7 = daysAgo(7);
  const last30 = daysAgo(30);

  const [
    totalUsers,
    usersByRole,
    activeUsers7,
    activeUsers30,
    newUsers7,
    newUsers30,
    totalCourses,
    publishedCourses,
    totalLessons,
    totalProgress,
    completedProgress,
    totalWorkshops,
    upcomingWorkshops,
    upcomingWorkshopStats,
    reviewAggregate,
    topCoursesByRating,
    instructorProfilesByStatus,
    commentsByStatus,
    coursesByCuisine,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ["role"],
      _count: true,
    }),
    prisma.user.count({ where: { lastLoginAt: { gte: last7 } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: last30 } } }),
    prisma.user.count({ where: { createdAt: { gte: last7 } } }),
    prisma.user.count({ where: { createdAt: { gte: last30 } } }),
    prisma.course.count({ where: { deletedAt: null } }),
    prisma.course.count({ where: { published: true, deletedAt: null } }),
    prisma.lesson.count({ where: { published: true } }),
    prisma.progress.count({ where: { lessonId: { not: null } } }),
    prisma.progress.count({ where: { lessonId: { not: null }, completed: true } }),
    prisma.workshop.count(),
    prisma.workshop.count({ where: { startTime: { gte: now } } }),
    prisma.workshop.findMany({
      where: { startTime: { gte: now } },
      select: {
        id: true,
        capacity: true,
        reservations: {
          where: { status: "RESERVED" },
          select: { id: true },
        },
      },
    }),
    prisma.review.aggregate({
      where: { status: "APPROVED" },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ["courseId"],
      where: { targetType: "COURSE", courseId: { not: null }, status: "APPROVED" },
      _avg: { rating: true },
      _count: { _all: true },
      orderBy: { _avg: { rating: "desc" } },
      take: 8,
    }),
    prisma.instructorProfile.groupBy({
      by: ["verificationStatus"],
      _count: true,
    }),
    prisma.comment.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.course.groupBy({
      by: ["cuisineType"],
      where: { deletedAt: null },
      _count: true,
      orderBy: { _count: { cuisineType: "desc" } },
    }),
  ]);

  const roleCounts = usersByRole.reduce<Record<string, number>>((acc, item) => {
    acc[item.role] = item._count;
    return acc;
  }, {});

  const verificationCounts = instructorProfilesByStatus.reduce<Record<string, number>>((acc, item) => {
    acc[item.verificationStatus] = item._count;
    return acc;
  }, {});

  const commentCounts = commentsByStatus.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = item._count;
    return acc;
  }, {});

  const progressCompletionRate = totalProgress > 0
    ? Math.round((completedProgress / totalProgress) * 100)
    : 0;

  const upcomingCapacityTotal = upcomingWorkshopStats.reduce((acc, workshop) => {
    if (!workshop.capacity) return acc;
    return acc + workshop.capacity;
  }, 0);

  const upcomingReservedTotal = upcomingWorkshopStats.reduce((acc, workshop) => {
    return acc + workshop.reservations.length;
  }, 0);

  const occupancyRate = upcomingCapacityTotal > 0
    ? Math.round((upcomingReservedTotal / upcomingCapacityTotal) * 100)
    : 0;

  const topCourseIds = topCoursesByRating
    .map((item) => item.courseId)
    .filter((id): id is string => Boolean(id));

  const courseTitles = topCourseIds.length > 0
    ? await prisma.course.findMany({
        where: { id: { in: topCourseIds } },
        select: {
          id: true,
          title: true,
          instructor: { select: { name: true } },
        },
      })
    : [];

  const courseTitleMap = new Map(courseTitles.map((course) => [course.id, course]));

  const averageRating = reviewAggregate._avg.rating ?? 0;
  const totalReviews = reviewAggregate._count._all ?? 0;

  const cuisineRows = coursesByCuisine
    .filter((item) => item.cuisineType)
    .map((item) => ({
      label: item.cuisineType as string,
      value: item._count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analitika</h1>
        <p className="text-muted-foreground">
          Ključni pokazatelji korištenja platforme Gurmania.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Korisnici</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{newUsers7} novih u 7 dana • +{newUsers30} u 30 dana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tečajevi</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {publishedCourses} objavljeno • {totalCourses - publishedCourses} nacrta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live radionice</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkshops.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {upcomingWorkshops} nadolazećih • popunjenost {occupancyRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recenzije</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReviews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Prosječna ocjena {averageRating.toFixed(1)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Aktivni korisnici</CardTitle>
            <CardDescription>
              Aktivnost prema zadnjoj prijavi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span>Aktivni u 7 dana</span>
                <span className="font-medium">{activeUsers7}</span>
              </div>
              <Progress value={toPercent(activeUsers7, totalUsers)} className="mt-2" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span>Aktivni u 30 dana</span>
                <span className="font-medium">{activeUsers30}</span>
              </div>
              <Progress value={toPercent(activeUsers30, totalUsers)} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Struktura korisnika</CardTitle>
            <CardDescription>
              Uloge na platformi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Polaznici", value: roleCounts.STUDENT || 0 },
              { label: "Instruktori", value: roleCounts.INSTRUCTOR || 0 },
              { label: "Administratori", value: roleCounts.ADMIN || 0 },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{row.label}</span>
                  <span className="font-medium">{row.value}</span>
                </div>
                <Progress value={toPercent(row.value, totalUsers)} className="mt-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Napredak učenja</CardTitle>
            <CardDescription>
              Ukupna stopa dovršenosti lekcija
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold">{progressCompletionRate}%</div>
            <Progress value={progressCompletionRate} />
            <p className="text-xs text-muted-foreground">
              Dovršene lekcije: {completedProgress} / {totalProgress}
            </p>
            <p className="text-xs text-muted-foreground">
              Objavljenih lekcija: {totalLessons}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Tečajevi po kuhinji</CardTitle>
            <CardDescription>
              Najzastupljenije kuhinje među tečajevima
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cuisineRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nema podataka o kuhinjama.</p>
            ) : (
              cuisineRows.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                  <Progress value={toPercent(item.value, totalCourses)} className="mt-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verifikacije instruktora</CardTitle>
            <CardDescription>
              Status zahtjeva za verifikaciju
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Na čekanju</span>
              <Badge variant="outline">{verificationCounts.PENDING || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Odobreno</span>
              <Badge className="bg-emerald-500 text-white">{verificationCounts.APPROVED || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Odbijeno</span>
              <Badge variant="secondary">{verificationCounts.REJECTED || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moderacija komentara</CardTitle>
            <CardDescription>
              Status komentara na platformi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Na čekanju</span>
              <Badge variant="outline">{commentCounts.PENDING || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Odobreno</span>
              <Badge className="bg-emerald-500 text-white">{commentCounts.APPROVED || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Odbijeno</span>
              <Badge variant="secondary">{commentCounts.REJECTED || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Najbolje ocijenjeni tečajevi</CardTitle>
            <CardDescription>
              Najbolji prosjek (min. 1 recenzija)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topCoursesByRating.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nema dostupnih recenzija.</p>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tečaj</TableHead>
                      <TableHead>Instruktor</TableHead>
                      <TableHead className="text-right">Ocjena</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCoursesByRating.map((item) => {
                      const course = courseTitleMap.get(item.courseId ?? "");
                      return (
                        <TableRow key={item.courseId ?? `${item._avg.rating}-${item._count._all}` }>
                          <TableCell>{course?.title ?? "Nepoznat tečaj"}</TableCell>
                          <TableCell>{course?.instructor?.name ?? "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Badge variant="secondary">{(item._avg.rating ?? 0).toFixed(1)}</Badge>
                              <span className="text-xs text-muted-foreground">({item._count._all})</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operativni signali</CardTitle>
            <CardDescription>
              Ključni signali koji traže pažnju
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Zahtjevi za verifikaciju</p>
                <p className="text-xs text-muted-foreground">Instruktori čekaju odobrenje</p>
              </div>
              <Badge className="bg-orange-500 text-white">
                {verificationCounts.PENDING || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Komentari na čekanju</p>
                <p className="text-xs text-muted-foreground">Potrebna moderacija</p>
              </div>
              <Badge variant="outline">
                {commentCounts.PENDING || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Popunjenost radionica</p>
                <p className="text-xs text-muted-foreground">Nadolazeći termini</p>
              </div>
              <Badge variant="secondary">{occupancyRate}%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Aktivni korisnici (7 dana)</p>
                <p className="text-xs text-muted-foreground">Korisnici s prijavom</p>
              </div>
              <Badge variant="secondary">{activeUsers7}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
