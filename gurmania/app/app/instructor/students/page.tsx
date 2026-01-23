"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { Users, BookOpen } from 'lucide-react';

interface Student {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  courses: Array<{
    id: string;
    title: string;
    percent: number;
    completed: boolean;
  }>;
}

export default function InstructorStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await fetch('/api/instructor/students');
      const data = await response.json();
      if (response.ok) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  function getInitials(name: string | null): string {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Polaznici</h1>
          <p className="text-muted-foreground">
            Pregled svih polaznika upisanih na vaše tečajeve.
          </p>
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Polaznici</h1>
        <p className="text-muted-foreground">
          Pregled svih polaznika upisanih na vaše tečajeve.
        </p>
      </div>

      {students.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <Users className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Nema polaznika</h3>
              <p className="text-muted-foreground mt-1">
                Još nema polaznika upisanih na vaše tečajeve
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Card key={student.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={student.image || undefined} />
                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {student.name || "Bez imena"}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {student.email || "-"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>{student.courses.length} {student.courses.length === 1 ? 'tečaj' : 'tečaja'}</span>
                </div>

                <div className="space-y-2">
                  {student.courses.slice(0, 3).map((course) => (
                    <div key={course.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{course.title}</span>
                      {course.completed ? (
                        <Badge variant="default" className="text-xs shrink-0">
                          Završeno
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {course.percent}%
                        </Badge>
                      )}
                    </div>
                  ))}
                  {student.courses.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{student.courses.length - 3} više
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
