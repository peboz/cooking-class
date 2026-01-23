"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CourseCard } from '@/components/course-card';
import { ChevronLeft, User, Star, Users, BookOpen, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InstructorData {
  instructor: {
    id: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    specializations: string[];
    verified: boolean;
  };
  stats: {
    avgRating: number;
    totalStudents: number;
    totalCourses: number;
    reviewCount: number;
  };
  courses: Array<{
    id: string;
    title: string;
    instructor: string;
    level: string;
    rating: number;
    lessonCount: number;
    image: string;
    enrollmentCount: number;
  }>;
}

export default function InstructorProfilePage() {
  const params = useParams();
  const instructorId = params.instructorId as string;
  const { data: session } = useSession();
  
  const [data, setData] = useState<InstructorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInstructor = session?.user?.role === 'INSTRUCTOR' || session?.user?.role === 'ADMIN';
  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    const fetchInstructorProfile = async () => {
      try {
        const response = await fetch(`/api/profile/instructor/${instructorId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Greška pri dohvaćanju profila');
        }
        
        const profileData = await response.json();
        setData(profileData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Greška pri dohvaćanju profila');
      } finally {
        setLoading(false);
      }
    };

    if (instructorId) {
      fetchInstructorProfile();
    }
  }, [instructorId]);

  if (loading) {
    return (
            <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
        <Navbar user={session?.user} isInstructor={isInstructor} isAdmin={isAdmin} />
        <div className="container mx-auto px-4 py-8 max-w-6xl flex-1">
          <Skeleton className="h-8 w-32 mb-8" />
          
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[300px]" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
            <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
        <Navbar user={session?.user} isInstructor={isInstructor} isAdmin={isAdmin} />
        <div className="container mx-auto px-4 py-8 max-w-6xl flex-1">
          <Link href="/app/courses">
            <Button variant="ghost" className="mb-6 gap-2">
              <ChevronLeft className="h-4 w-4" />
              Natrag na tečajeve
            </Button>
          </Link>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {error || 'Instruktor nije pronađen'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const { instructor, stats, courses } = data;

  return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
      <Navbar user={session?.user} isInstructor={isInstructor} isAdmin={isAdmin} />
      <div className="container mx-auto px-4 py-8 max-w-6xl flex-1">
        {/* Back button */}
        <Link href="/app/courses">
          <Button variant="ghost" className="mb-6 gap-2">
            <ChevronLeft className="h-4 w-4" />
            Natrag na tečajeve
          </Button>
        </Link>

        {/* Instructor Profile Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={instructor.image || undefined} />
                  <AvatarFallback className="text-3xl">
                    <User className="h-16 w-16" />
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h1 className="text-3xl font-bold">
                      {instructor.name || 'Nepoznat instruktor'}
                    </h1>
                    {instructor.verified && (
                      <Badge variant="default" className="gap-1 bg-orange-600">
                        <Award className="h-3 w-3" />
                        Verificiran
                      </Badge>
                    )}
                  </div>

                  {instructor.bio && (
                    <p className="text-muted-foreground mt-3">
                      {instructor.bio}
                    </p>
                  )}
                </div>

                {/* Specializations */}
                {instructor.specializations && instructor.specializations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Specijalizacije:</h3>
                    <div className="flex flex-wrap gap-2">
                      {instructor.specializations.map((spec, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold">
                        {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Prosječna ocjena
                      {stats.reviewCount > 0 && ` (${stats.reviewCount})`}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="h-4 w-4 text-orange-600" />
                      <span className="text-2xl font-bold">{stats.totalStudents}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Polaznika</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <BookOpen className="h-4 w-4 text-orange-600" />
                      <span className="text-2xl font-bold">{stats.totalCourses}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Tečajeva</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Tečajevi</h2>
          
          {courses.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Instruktor trenutno nema objavljenih tečajeva.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  href={`/app/courses/${course.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
