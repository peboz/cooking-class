"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateCourseDialog } from '@/components/create-course-dialog';
import { Plus, BookOpen, Edit, Clock } from 'lucide-react';
import Image from 'next/image';

interface Course {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  cuisineType: string | null;
  published: boolean;
  updatedAt: string;
  moduleCount: number;
  lessonCount: number;
  media?: { url: string; type: string }[];
}

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/instructor/courses');
      const data = await response.json();
      if (response.ok) {
        setCourses(data.courses);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      'EASY': 'Lako',
      'MEDIUM': 'Srednje',
      'HARD': 'Teško',
    };
    return labels[difficulty] || difficulty;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tečajevi</h1>
            <p className="text-muted-foreground">
              Upravljajte svojim tečajevima i kreirajte nove.
            </p>
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tečajevi</h1>
          <p className="text-muted-foreground">
            Upravljajte svojim tečajevima i kreirajte nove.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novi tečaj
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Nemate još tečajeva</h3>
              <p className="text-muted-foreground mt-1">
                Započnite s kreiranjem svog prvog tečaja
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Kreiraj prvi tečaj
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const thumbnail = course.media?.find(m => m.type === 'IMAGE');
            
            return (
              <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow p-0">
                {thumbnail ? (
                  <div className="relative h-48 w-full">
                    <Image
                      src={thumbnail.url}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-orange-600 dark:text-orange-300" />
                  </div>
                )}
                
                <CardHeader className="p-6 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <Badge variant={course.published ? 'default' : 'secondary'}>
                      {course.published ? 'Objavljeno' : 'Skica'}
                    </Badge>
                  </div>
                  {course.description && (
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 px-6 pb-6 pt-0">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">{getDifficultyLabel(course.difficulty)}</Badge>
                    {course.cuisineType && (
                      <Badge variant="outline">{course.cuisineType}</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.moduleCount} modula</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.lessonCount} lekcija</span>
                    </div>
                  </div>

                  <Link href={`/app/instructor/courses/${course.id}`} className="block">
                    <Button variant="outline" className="w-full gap-2">
                      <Edit className="h-4 w-4" />
                      Uredi tečaj
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCourseDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
