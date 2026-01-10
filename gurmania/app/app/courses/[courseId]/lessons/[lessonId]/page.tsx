'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { YouTubeEmbed } from '@/components/youtube-embed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  ShoppingCart,
  AlertCircle,
  Home
} from 'lucide-react';
import Link from 'next/link';

interface Ingredient {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  optional: boolean;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  steps: string | null;
  durationMin: number | null;
  difficulty: string;
  allergens: string[];
  ingredients: Ingredient[];
  module: {
    id: string;
    title: string;
  };
  course: {
    id: string;
    title: string;
  };
  navigation: {
    previousLesson: { id: string; title: string } | null;
    nextLesson: { id: string; title: string } | null;
  };
  userProgress: {
    isCompleted: boolean;
  };
}

export default function LessonViewerPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);

  useEffect(() => {
    fetchLesson();
    fetchUserProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setIsInstructor(data.role === 'INSTRUCTOR' || data.role === 'ADMIN' || data.instructorProfile?.verified);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchLesson = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch lesson');
      }

      const data = await response.json();
      setLesson(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error fetching lesson:', err);
      setError(err.message || 'Greška pri učitavanju lekcije');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!lesson || isCompleting) return;
    
    try {
      setIsCompleting(true);
      
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          lessonId,
          completed: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      // Update local state
      setLesson({
        ...lesson,
        userProgress: { isCompleted: true },
      });

      // Navigate to next lesson if available
      if (lesson.navigation.nextLesson) {
        router.push(`/app/courses/${courseId}/lessons/${lesson.navigation.nextLesson.id}`);
      }
    } catch (err) {
      console.error('Error updating progress:', err);
      alert('Greška pri ažuriranju napretka');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleGenerateShoppingList = async () => {
    if (!lesson) return;
    
    try {
      const response = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          title: `${lesson.course.title} - ${lesson.title}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create shopping list');
      }

      alert('Lista za kupovinu je stvorena!');
    } catch (err) {
      console.error('Error creating shopping list:', err);
      alert('Greška pri stvaranju liste za kupovinu');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
        <Navbar user={session?.user} isInstructor={isInstructor} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
        <Navbar user={session?.user} isInstructor={isInstructor} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
              <h2 className="text-2xl font-bold">Greška</h2>
              <p className="text-muted-foreground">{error || 'Lekcija nije pronađena'}</p>
              <Button asChild>
                <Link href={`/app/courses/${courseId}`}>
                  <Home className="h-4 w-4 mr-2" />
                  Povratak na tečaj
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const difficultyMap: Record<string, string> = {
    'EASY': 'Lako',
    'MEDIUM': 'Srednje',
    'HARD': 'Teško',
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
      <Navbar user={session?.user} isInstructor={isInstructor} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/app" className="hover:text-foreground">Početna</Link>
          <span>/</span>
          <Link href={`/app/courses/${courseId}`} className="hover:text-foreground">
            {lesson.course.title}
          </Link>
          <span>/</span>
          <span className="text-foreground">{lesson.title}</span>
        </nav>

        {/* Lesson header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-lg text-muted-foreground">{lesson.description}</p>
          )}
          <div className="flex items-center gap-3 mt-4">
            <Badge variant="secondary">{difficultyMap[lesson.difficulty] || lesson.difficulty}</Badge>
            {lesson.durationMin && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lesson.durationMin} min
              </Badge>
            )}
            {lesson.userProgress.isCompleted && (
              <Badge variant="default" className="bg-green-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Završeno
              </Badge>
            )}
          </div>
          {lesson.allergens && lesson.allergens.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm">Alergeni: {lesson.allergens.join(', ')}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recipe steps */}
            {lesson.steps && (
              <Card>
                <CardHeader>
                  <CardTitle>Koraci pripreme</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: lesson.steps }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Video player */}
            {lesson.videoUrl && (
              <div>
                <YouTubeEmbed videoUrl={lesson.videoUrl} />
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-4">
              {lesson.navigation.previousLesson ? (
                <Button 
                  variant="outline" 
                  asChild
                  className="flex-1"
                >
                  <Link href={`/app/courses/${courseId}/lessons/${lesson.navigation.previousLesson.id}`}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Prethodna lekcija
                  </Link>
                </Button>
              ) : (
                <div className="flex-1" />
              )}

              {!lesson.userProgress.isCompleted && (
                <Button 
                  onClick={handleMarkComplete}
                  disabled={isCompleting}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isCompleting ? 'Spremanje...' : 'Označi kao završeno'}
                </Button>
              )}

              {lesson.navigation.nextLesson ? (
                <Button 
                  asChild
                  className="flex-1"
                >
                  <Link href={`/app/courses/${courseId}/lessons/${lesson.navigation.nextLesson.id}`}>
                    Sljedeća lekcija
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button 
                  asChild
                  variant="outline"
                  className="flex-1"
                >
                  <Link href={`/app/courses/${courseId}`}>
                    Povratak na tečaj
                    <Home className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ingredients */}
            {lesson.ingredients && lesson.ingredients.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Sastojci</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2">
                    {lesson.ingredients.map((ingredient) => (
                      <li key={ingredient.id} className="flex items-center gap-2">
                        <span className="text-orange-500">•</span>
                        <span className="flex-1">
                          {ingredient.quantity && ingredient.unit && (
                            <span className="font-medium">
                              {ingredient.quantity} {ingredient.unit}{' '}
                            </span>
                          )}
                          {ingredient.name}
                          {ingredient.optional && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (opcionalno)
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <Separator />
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleGenerateShoppingList}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Stvori listu za kupovinu
                  </Button>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
