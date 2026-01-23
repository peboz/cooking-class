import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, GraduationCap, BookOpen, ShieldAlert, RefreshCw } from "lucide-react";
import { prisma } from "@/prisma";
import { revalidatePath } from "next/cache";

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

async function getDashboardStats() {
  const [
    totalUsers,
    usersByRole,
    totalCourses,
    publishedCourses,
    pendingVerifications,
    inactiveUsers,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ['role'],
      _count: true,
    }),
    prisma.course.count({ where: { deletedAt: null } }),
    prisma.course.count({ where: { published: true, deletedAt: null } }),
    prisma.instructorProfile.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const roleCount = usersByRole.reduce((acc: Record<string, number>, { role, _count }: { role: string; _count: number }) => {
    acc[role] = _count;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalUsers,
    students: roleCount.STUDENT || 0,
    instructors: roleCount.INSTRUCTOR || 0,
    admins: roleCount.ADMIN || 0,
    totalCourses,
    publishedCourses,
    pendingVerifications,
    inactiveUsers,
    recentAuditLogs,
    lastUpdated: new Date(),
  };
}

async function refreshDashboard() {
  'use server';
  revalidatePath('/admin');
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'USER_ROLE_CHANGED': 'Promjena uloge',
      'USER_SUSPENDED': 'Suspenzija korisnika',
      'USER_ACTIVATED': 'Aktivacija korisnika',
      'INSTRUCTOR_COURSES_HIDDEN': 'Skriveni tečajevi instruktora',
      'COURSE_PUBLISHED': 'Objavljen tečaj',
      'COURSE_UNPUBLISHED': 'Povučen tečaj',
      'COURSE_DELETED': 'Obrisan tečaj',
      'COMMENT_APPROVED': 'Odobren komentar',
      'COMMENT_REJECTED': 'Odbijen komentar',
      'VERIFICATION_APPROVED': 'Odobrena verifikacija',
      'VERIFICATION_REJECTED': 'Odbijena verifikacija',
    };
    return labels[action] || action;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("hr-HR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Dobrodošli u admin panel platforme Gurmania
          </p>
        </div>
        <form action={refreshDashboard}>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Osvježi
          </Button>
        </form>
      </div>

      <div className="text-xs text-muted-foreground">
        Zadnje ažurirano: {formatDate(stats.lastUpdated)}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupno korisnika</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.students} polaznika • {stats.instructors} instruktora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktivni instruktori</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.instructors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Verificirani instruktori
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tečajevi</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.publishedCourses} objavljeno
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Na čekanju</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingVerifications.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Zahtjevi za verifikaciju
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.pendingVerifications > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Zahtjevi za verifikaciju</CardTitle>
              <CardDescription>Instruktori čekaju odobrenje</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/verification-requests">
                <Button className="w-full">
                  Pregledaj zahtjeve
                  <Badge className="ml-2">{stats.pendingVerifications}</Badge>
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {stats.inactiveUsers > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Neaktivni korisnici</CardTitle>
              <CardDescription>Deaktivirani ili suspendirani</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/users?status=inactive">
                <Button variant="outline" className="w-full">
                  Pregledaj korisnike
                  <Badge variant="outline" className="ml-2">{stats.inactiveUsers}</Badge>
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upravljanje tečajevima</CardTitle>
            <CardDescription>Moderiraj i uredi sadržaj</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/courses">
              <Button variant="outline" className="w-full">
                Prikaži sve tečajeve
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Nedavne aktivnosti</CardTitle>
          <CardDescription>Posljednjih 5 admin akcija</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentAuditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nema nedavnih aktivnosti</p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Akcija</TableHead>
                    <TableHead>Administrator</TableHead>
                    <TableHead>Datum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentAuditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline">{getActionLabel(log.action)}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.user?.name || log.user?.email || 'Nepoznat'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(log.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

