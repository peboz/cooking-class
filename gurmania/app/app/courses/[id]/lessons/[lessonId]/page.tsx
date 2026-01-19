'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { YouTubeEmbed } from '@/components/youtube-embed';
import { CommentsSection } from '@/components/comments-section';
import { CourseReviewDialog } from '@/components/course-review-dialog';
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
  Home,
  Lock
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
  quiz: {
    id: string;
    title: string;
    passingScore: number | null;
  } | null;
  userProgress: {
    isCompleted: boolean;
  };
  quizPassed: boolean;
}

export default function LessonViewerPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [showLockedDialog, setShowLockedDialog] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

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
        
        // Check if this is a locked lesson error
        if (response.status === 403 && data.locked) {
          setShowLockedDialog(true);
          setError(data.error || 'Lekcija je zaključana');
          return;
        }
        
        throw new Error(data.error || 'Failed to fetch lesson');
      }

      const data = await response.json();
      setLesson(data);
    } catch (err) {
      console.error('Error fetching lesson:', err);
      setError(err instanceof Error ? err.message : 'Greška pri učitavanju lekcije');
    } finally {
      setLoading(false);
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
        const data = await response.json();
        throw new Error(data.error || 'Failed to update progress');
      }

      // Update local state
      setLesson({
        ...lesson,
        userProgress: { isCompleted: true },
      });

      // Check if this is the last lesson
      if (!lesson.navigation.nextLesson) {
        // This is the last lesson - generate certificate automatically
        try {
          const certResponse = await fetch(`/api/courses/${courseId}/certificate`, {
            method: 'POST',
          });
          
          if (certResponse.ok) {
            // Certificate generated successfully - notification will be shown from server
          } else if (certResponse.status !== 409) {
            // 409 means certificate already exists, which is fine
            console.error('Failed to generate certificate');
          }
        } catch (certError) {
          console.error('Error generating certificate:', certError);
          // Don't block the flow - certificate can be generated later
        }

        // Check if user has reviewed the course
        const reviewResponse = await fetch(`/api/courses/${courseId}/reviews`);
        if (reviewResponse.ok) {
          const reviewData = await reviewResponse.json();
          const userReview = reviewData.reviews.find(
            (r: { user: { id: string } }) => r.user.id === session?.user?.id
          );
          // Only show if user hasn't reviewed yet
          if (!userReview) {
            setShowReviewDialog(true);
            return; // Don't navigate away
          }
        }
      }

      // 
      // Navigate to next lesson if available
      if (lesson.navigation.nextLesson) {
        router.push(`/app/courses/${courseId}/lessons/${lesson.navigation.nextLesson.id}`);
      }
    } catch (err) {
      console.error('Error updating progress:', err);
      const errorMessage = err instanceof Error ? err.message : 'Greška pri ažuriranju napretka';
      alert(errorMessage);
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
        <Navbar user={session?.user} isInstructor={session?.user?.role === "INSTRUCTOR" || session?.user?.role === "ADMIN"} />
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
        <Navbar user={session?.user} isInstructor={session?.user?.role === "INSTRUCTOR" || session?.user?.role === "ADMIN"} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center space-y-4">
              {showLockedDialog ? (
                <>
                  <Lock className="h-16 w-16 text-orange-500 mx-auto" />
                  <h2 className="text-2xl font-bold">Lekcija je zaključana</h2>
                  <p className="text-muted-foreground">{error}</p>
                  <p className="text-sm text-muted-foreground">
                    Morate završiti sve kvizove iz prethodnih modula prije nego što možete pristupiti ovoj lekciji.
                  </p>
                  <Button asChild>
                    <Link href={`/app/courses/${courseId}`}>
                      <Home className="h-4 w-4 mr-2" />
                      Povratak na tečaj
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
                  <h2 className="text-2xl font-bold">Greška</h2>
                  <p className="text-muted-foreground">{error || 'Lekcija nije pronađena'}</p>
                  <Button asChild>
                    <Link href={`/app/courses/${courseId}`}>
                      <Home className="h-4 w-4 mr-2" />
                      Povratak na tečaj
                    </Link>
                  </Button>
                </>
              )}
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
      <Navbar user={session?.user} isInstructor={session?.user?.role === "INSTRUCTOR" || session?.user?.role === "ADMIN"} />
      
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
            {/* Video player */}
            {lesson.videoUrl && (
              <div>
                <YouTubeEmbed videoUrl={lesson.videoUrl} />
              </div>
            )}

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

            {/* Quiz Section */}
            {lesson.quiz && (
              <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-orange-600" />
                    {lesson.quiz.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm">
                    {lesson.quizPassed ? (
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Uspješno ste završili kviz i lekciju!</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="font-medium text-foreground">
                          Morate riješiti kviz kako biste završili ovu lekciju.
                        </p>
                        {lesson.quiz.passingScore !== null ? (
                          <p className="text-muted-foreground">
                            Minimalni prolazni rezultat: <span className="font-semibold text-orange-600">{lesson.quiz.passingScore}%</span>
                          </p>
                        ) : (
                          <p className="text-muted-foreground">
                            Riješite kviz kako biste označili lekciju kao završenu.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <Button asChild className="w-full sm:w-auto">
                    <Link href={`/app/quiz/${lesson.quiz.id}?returnUrl=/app/courses/${courseId}/lessons/${lesson.id}`}>
                      {lesson.quizPassed ? 'Pokušaj ponovno' : 'Pokreni kviz'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
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

              {/* Show mark complete button only for lessons without quiz */}
              {!lesson.quiz && !lesson.userProgress.isCompleted && (
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
                <div className="flex-1" />
              )}
            </div>

            {/* Comments Section */}
            {session?.user?.id && (
              <CommentsSection
                courseId={courseId}
                lessonId={lessonId}
                currentUserId={session.user.id}
              />
            )}

            {/* Return to course button */}
            <div className="flex justify-center">
              <Button 
                asChild
                variant="outline"
              >
                <Link href={`/app/courses/${courseId}`}>
                  <Home className="h-4 w-4 mr-2" />
                  Povratak na tečaj
                </Link>
              </Button>
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

      {/* Review Dialog - shown after completing last lesson */}
      {lesson && (
        <CourseReviewDialog
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          courseId={courseId}
          courseTitle={lesson.course.title}
          onSuccess={() => {
            // Refresh page or redirect to course page
            router.push(`/app/courses/${courseId}`);
          }}
        />
      )}
    </div>
  );
}
