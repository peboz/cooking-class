'use client';

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CourseTitle } from "@/components/course-title"
import { CourseReviewDialog } from "@/components/course-review-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Clock, 
  BookOpen, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  Play,
  User,
  Award,
  CheckCircle,
  Lock,
  Edit,
  Trash2,
  MessageSquare,
  Download,
  CalendarDays,
  Users
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

interface CourseData {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  cuisineType: string | null;
  tags: string[];
  published: boolean;
  instructorId: string;
  instructor: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    instructorProfile: {
      bio: string | null;
      specializations: string[];
      verified: boolean;
    } | null;
  };
  modules: Array<{
    id: string;
    title: string;
    description: string | null;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      description: string | null;
      durationMin: number | null;
      order: number;
    }>;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    photoUrl: string | null;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }>;
  media: Array<{
    id: string;
    url: string;
    type: string;
  }>;
  progress: Array<{
    lessonId: string | null;
  }>;
  lockedModules: string[];
}

interface CourseWorkshop {
  id: string;
  title: string;
  startTime: string;
  durationMin?: number | null;
  capacity?: number | null;
  reservedCount: number;
  isReserved: boolean;
  isInstructor: boolean;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const courseId = params.id as string;

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [certificate, setCertificate] = useState<{ id: string; pdfUrl: string; issuedAt: string } | null>(null);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [courseWorkshops, setCourseWorkshops] = useState<CourseWorkshop[]>([]);
  const [workshopsLoading, setWorkshopsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated") {
      fetchCourse();
      fetchUserProfile();
      fetchCertificate();
      fetchCourseWorkshops();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, courseId]);

  const fetchCourseWorkshops = async () => {
    try {
      setWorkshopsLoading(true);
      const response = await fetch(`/api/workshops?courseId=${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch workshops');
      }
      const data = await response.json();
      setCourseWorkshops(data.workshops || []);
    } catch (error) {
      console.error('Error fetching workshops:', error);
    } finally {
      setWorkshopsLoading(false);
    }
  };

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

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}`);
      
      if (!response.ok) {
        if (response.status === 403 || response.status === 404) {
          router.push("/app/courses");
        }
        throw new Error('Failed to fetch course');
      }

      const data = await response.json();
      setCourse(data as unknown as CourseData);
    } catch (error) {
      console.error('Error fetching course:', error);
      router.push("/app/courses");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!course || enrolling) return;

    try {
      setEnrolling(true);
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to enroll');
      }

      // Refresh course data to update enrollment status
      await fetchCourse();
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Greška pri upisu na tečaj');
    } finally {
      setEnrolling(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Jeste li sigurni da želite obrisati recenziju?')) {
      return;
    }

    try {
      setDeletingReviewId(reviewId);
      const response = await fetch(`/api/courses/${courseId}/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete review');
      }

      toast.success('Recenzija je uspješno obrisana');
      await fetchCourse(); // Refresh to update reviews
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error(
        error instanceof Error ? error.message : 'Greška pri brisanju recenzije'
      );
    } finally {
      setDeletingReviewId(null);
    }
  };

  const fetchCertificate = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/certificate`);
      if (response.ok) {
        const data = await response.json();
        if (data.id) {
          setCertificate({
            id: data.id,
            pdfUrl: data.pdfUrl,
            issuedAt: data.issuedAt,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching certificate:', error);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      setGeneratingCertificate(true);
      
      const response = await fetch(`/api/courses/${courseId}/certificate`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate certificate');
      }

      const data = await response.json();
      
      if (!data.id || !data.pdfUrl) {
        throw new Error('Neispravan odgovor s poslužitelja');
      }
      
      setCertificate({
        id: data.id,
        pdfUrl: data.pdfUrl,
        issuedAt: data.issuedAt,
      });
      toast.success('Certifikat je uspješno generiran i poslan na vašu e-mail adresu!');
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error(
        error instanceof Error ? error.message : 'Greška pri generiranju certifikata'
      );
    } finally {
      setGeneratingCertificate(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
        <Navbar user={session?.user} isInstructor={isInstructor} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-32 w-full mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  // Calculate stats
  const lessonCount = course.modules.reduce(
    (acc, module) => acc + module.lessons.length,
    0
  );
  
  const avgRating = course.reviews.length > 0
    ? course.reviews.reduce((acc, r) => acc + r.rating, 0) / course.reviews.length
    : 0;
  
  const totalDuration = course.modules.reduce(
    (acc, module) => 
      acc + module.lessons.reduce(
        (lAcc, lesson) => lAcc + (lesson.durationMin || 0),
        0
      ),
    0
  );

  // Get user progress
  const completedLessons = course.progress
    .map(p => p.lessonId)
    .filter(Boolean) as string[];
  const progressPercentage = lessonCount > 0 
    ? (completedLessons.length / lessonCount) * 100 
    : 0;
  const isEnrolled = course.progress.length > 0;

  // Get first lesson for "Start Learning" button
  const firstLesson = course.modules[0]?.lessons[0];
  const nextLesson = course.modules
    .flatMap(m => m.lessons)
    .find(l => !completedLessons.includes(l.id));

  const thumbnail = course.media.find(m => m.type === 'IMAGE')?.url || '/placeholder-course.jpg';

  // Format difficulty
  const difficultyMap: Record<string, string> = {
    'EASY': 'Lako',
    'MEDIUM': 'Srednje',
    'HARD': 'Teško',
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
      <Navbar user={session?.user} isInstructor={isInstructor} />
      
      <main className="flex-1">
        <CourseTitle 
          title={course.title}
          instructor={course.instructor.name || 'Nepoznati instruktor'}
          instructorId={course.instructor.id}
          level={difficultyMap[course.difficulty] || course.difficulty}
          duration={totalDuration > 0 ? `${Math.round(totalDuration / 60)} sati` : undefined}
          rating={avgRating > 0 ? avgRating.toFixed(1) : undefined}
        />

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content - LEFT SIDE */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress indicator if enrolled */}
              {isEnrolled && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Vaš napredak
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{completedLessons.length} od {lessonCount} lekcija završeno</span>
                      <span className="font-semibold">{progressPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </CardContent>
                </Card>
              )}

              {/* Modules and lessons */}
              <Card>
                <CardHeader>
                  <CardTitle>Sadržaj tečaja</CardTitle>
                  <CardDescription>
                    {course.modules.length} modula • {lessonCount} lekcija
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.modules.map((module, moduleIndex) => {
                    // Find first module with incomplete lessons
                    const firstIncompleteModuleIndex = course.modules.findIndex((m: typeof module) =>
                      m.lessons.some((l: { id: string }) => !completedLessons.includes(l.id))
                    );
                    
                    const isModuleLocked = course.lockedModules?.includes(module.id) || false;
                    
                    return (
                      <ModuleSection 
                        key={module.id} 
                        module={module}
                        moduleIndex={moduleIndex}
                        courseId={courseId}
                        completedLessons={completedLessons}
                        isEnrolled={isEnrolled}
                        onUnenrolledClick={() => setShowEnrollDialog(true)}
                        shouldBeOpen={moduleIndex === firstIncompleteModuleIndex}
                        isLocked={isModuleLocked}
                      />
                    );
                  })}
                </CardContent>
              </Card>

              {/* Upcoming workshops */}
              <Card>
                <CardHeader>
                  <CardTitle>Live radionice uz ovaj tečaj</CardTitle>
                  <CardDescription>Pridružite se praktičnim radionicama povezanim s ovim tečajem.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workshopsLoading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : courseWorkshops.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Trenutno nema nadolazećih radionica.</p>
                  ) : (
                    <div className="space-y-3">
                      {courseWorkshops.map((workshop) => {
                        const start = new Date(workshop.startTime);
                        return (
                          <div key={workshop.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4">
                            <div className="space-y-2">
                              <div className="font-medium">{workshop.title}</div>
                              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <CalendarDays className="h-4 w-4" />
                                  <span>{start.toLocaleString('hr-HR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                </div>
                                {workshop.durationMin && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{workshop.durationMin} min</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>{workshop.reservedCount}/{workshop.capacity ?? '∞'} mjesta</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/app/workshops/${workshop.id}`}>Detalji</Link>
                              </Button>
                              <Button size="sm" asChild>
                                <Link href="/app/workshops">Rezerviraj mjesto</Link>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reviews */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recenzije</CardTitle>
                      <CardDescription>
                        {course.reviews.length > 0 
                          ? `${course.reviews.length} recenzija • ${avgRating.toFixed(1)} prosječna ocjena`
                          : 'Još nema recenzija'
                        }
                      </CardDescription>
                    </div>
                    {/* Show "Rate Course" button if enrolled and all lessons completed */}
                    {isEnrolled && progressPercentage === 100 && course.instructorId !== session?.user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReviewDialog(true)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {course.reviews.some(r => r.user.id === session?.user?.id) 
                          ? 'Uredi recenziju' 
                          : 'Ocijeni tečaj'
                        }
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {course.reviews.length > 0 && (
                  <CardContent className="space-y-6">
                    {course.reviews.map((review) => {
                      const isOwnReview = review.user.id === session?.user?.id;
                      const isAdmin = session?.user?.role === 'ADMIN';
                      const canDelete = isOwnReview || isAdmin;

                      return (
                        <div key={review.id} className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={review.user.image || undefined} />
                              <AvatarFallback>
                                {review.user.name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {review.user.name}
                                    {isOwnReview && (
                                      <Badge variant="secondary" className="text-xs">
                                        Vaša recenzija
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-0.5">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star 
                                          key={i} 
                                          className={`h-4 w-4 ${
                                            i < review.rating 
                                              ? 'fill-yellow-400 text-yellow-400' 
                                              : 'text-gray-300'
                                          }`} 
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(review.createdAt).toLocaleDateString('hr-HR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                </div>
                                {canDelete && (
                                  <div className="flex gap-1">
                                    {isOwnReview && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowReviewDialog(true)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteReview(review.id)}
                                      disabled={deletingReviewId === review.id}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              {review.comment && (
                                <p className="text-sm text-muted-foreground">
                                  {review.comment}
                                </p>
                              )}
                              {review.photoUrl && (
                                <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border mt-2">
                                  <Image
                                    src={review.photoUrl}
                                    alt="Recenzija fotografija"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          {review !== course.reviews[course.reviews.length - 1] && (
                            <Separator />
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Sidebar - RIGHT SIDE */}
            <div className="space-y-6">
              {/* Course image and enrollment */}
              <Card className="overflow-hidden p-0">
                <div className="relative h-48 w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4 pt-3 space-y-3">
                  {isEnrolled ? (
                    <Button 
                      className="w-full" 
                      size="lg"
                      asChild
                    >
                      <Link href={`/app/courses/${courseId}/lessons/${nextLesson?.id || firstLesson?.id}`}>
                        <Play className="h-4 w-4 mr-2" />
                        {progressPercentage > 0 ? 'Nastavi učiti' : 'Počni učiti'}
                      </Link>
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      {enrolling ? 'Upisivanje...' : 'Upiši se'}
                    </Button>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{Math.round(totalDuration / 60)}h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{lessonCount} lekcija</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span>{avgRating > 0 ? avgRating.toFixed(1) : 'Bez ocjena'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span>{difficultyMap[course.difficulty]}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course description */}
              <Card>
                <CardHeader>
                  <CardTitle>O tečaju</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                    {course.description || 'Nema opisa'}
                  </p>
                  
                  {course.tags && course.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {course.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Instructor info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Instruktor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={course.instructor.image || undefined} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link 
                        href={`/app/profile/instructor/${course.instructor.id}`}
                        className="font-semibold hover:text-orange-600 transition-colors cursor-pointer"
                      >
                        {course.instructor.name}
                      </Link>
                      {course.instructor.instructorProfile?.verified && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Verificiran
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {course.instructor.instructorProfile?.bio && (
                    <p className="text-sm text-muted-foreground">
                      {course.instructor.instructorProfile.bio}
                    </p>
                  )}
                  
                  {course.instructor.instructorProfile?.specializations && 
                   course.instructor.instructorProfile.specializations.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Specijalizacije:</div>
                      <div className="flex flex-wrap gap-1">
                        {course.instructor.instructorProfile.specializations.map((spec, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Certificate */}
              {isEnrolled && progressPercentage === 100 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      Certifikat
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {certificate && certificate.pdfUrl ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Čestitamo na završetku tečaja! Vaš certifikat je dostupan za preuzimanje.
                        </p>
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={() => window.open(certificate.pdfUrl, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Preuzmi certifikat
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          Izdan {new Date(certificate.issuedAt).toLocaleDateString('hr-HR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Čestitamo na završetku tečaja! Generirajte svoj certifikat kako biste ga dobili na e-mail i preuzeli.
                        </p>
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={handleGenerateCertificate}
                          disabled={generatingCertificate}
                        >
                          <Award className="h-4 w-4 mr-2" />
                          {generatingCertificate ? 'Generiranje...' : 'Generiraj certifikat'}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Motivational certificate card if not yet completed */}
              {isEnrolled && progressPercentage < 100 && (
                <Card className="border-yellow-200 dark:border-yellow-900 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      Zaradite certifikat
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Završite sve lekcije u ovom tečaju i dobijte profesionalni certifikat koji možete dijeliti sa drugima!
                    </p>
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>Vaš napredak:</span>
                      <span className="text-yellow-600 dark:text-yellow-400">{progressPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Enrollment Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Potrebna je upis na tečaj
            </DialogTitle>
            <DialogDescription>
              Morate se upisati na ovaj tečaj kako biste pristupili lekcijama i materijalima.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEnrollDialog(false)}
            >
              Odustani
            </Button>
            <Button
              onClick={async () => {
                setShowEnrollDialog(false);
                await handleEnroll();
              }}
              disabled={enrolling}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {enrolling ? 'Upisivanje...' : 'Upiši se sada'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <CourseReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        courseId={courseId}
        courseTitle={course.title}
        existingReview={
          course.reviews.find(r => r.user.id === session?.user?.id) || null
        }
        onSuccess={() => {
          fetchCourse(); // Refresh to update reviews
        }}
      />
    </div>
  );
}

// Module section component with collapsible lessons
function ModuleSection({ 
  module, 
  moduleIndex, 
  courseId, 
  completedLessons,
  isEnrolled,
  onUnenrolledClick,
  shouldBeOpen,
  isLocked = false
}: { 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  module: any; 
  moduleIndex: number; 
  courseId: string;
  completedLessons: string[];
  isEnrolled: boolean;
  onUnenrolledClick: () => void;
  shouldBeOpen: boolean;
  isLocked?: boolean;
}) {
  // Check if all lessons in this module are completed
  const allLessonsCompleted = module.lessons.every((lesson: { id: string }) => 
    completedLessons.includes(lesson.id)
  );

  const [showLockedDialog, setShowLockedDialog] = useState(false);
  
  return (
    <>
    <details className="group" open={shouldBeOpen && !isLocked}>
      <summary className="flex items-center justify-between cursor-pointer p-4 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isLocked ? (
              <Lock className="h-5 w-5 text-muted-foreground" />
            ) : (
              <>
                <ChevronDown className="h-5 w-5 group-open:hidden" />
                <ChevronUp className="h-5 w-5 hidden group-open:block" />
              </>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${isLocked ? 'text-muted-foreground' : ''}`}>{module.title}</span>
              {isLocked && (
                <Badge variant="outline" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Zaključano
                </Badge>
              )}
              {allLessonsCompleted && isEnrolled && !isLocked && (
                <Badge variant="default" className="bg-green-500 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Završeno
                </Badge>
              )}
            </div>
            {module.description && (
              <div className="text-sm text-muted-foreground">
                {module.description}
              </div>
            )}
          </div>
        </div>
        <Badge variant="secondary">
          {module.lessons.length} lekcija
        </Badge>
      </summary>
      
      <div className="mt-2 ml-4 space-y-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {module.lessons.map((lesson: any, lessonIndex: number) => {
          const isCompleted = completedLessons.includes(lesson.id);
          
          return isEnrolled && !isLocked ? (
            <Link 
              key={lesson.id}
              href={`/app/courses/${courseId}/lessons/${lesson.id}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group/lesson"
            >
              <div className="flex items-center gap-3 flex-1">
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-medium group-hover/lesson:text-primary">
                    {lessonIndex + 1}. {lesson.title}
                  </div>
                  {lesson.description && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {lesson.description}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {lesson.durationMin && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{lesson.durationMin} min</span>
                  </div>
                )}
                <Play className="h-4 w-4 opacity-0 group-hover/lesson:opacity-100 transition-opacity" />
              </div>
            </Link>
          ) : isLocked ? (
            <button
              key={lesson.id}
              onClick={() => setShowLockedDialog(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg opacity-60 hover:opacity-80 hover:bg-muted/30 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 flex-1">
                <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium">
                    {lessonIndex + 1}. {lesson.title}
                  </div>
                  {lesson.description && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {lesson.description}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {lesson.durationMin && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{lesson.durationMin} min</span>
                  </div>
                )}
              </div>
            </button>
          ) : (
            <button
              key={lesson.id}
              onClick={onUnenrolledClick}
              className="w-full flex items-center gap-3 p-3 rounded-lg opacity-60 hover:opacity-80 hover:bg-muted/30 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 flex-1">
                <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium">
                    {lessonIndex + 1}. {lesson.title}
                  </div>
                  {lesson.description && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {lesson.description}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {lesson.durationMin && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{lesson.durationMin} min</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </details>

    <Dialog open={showLockedDialog} onOpenChange={setShowLockedDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-500" />
            Modul je zaključan
          </DialogTitle>
          <DialogDescription>
            Morate završiti sve kvizove iz prethodnih modula prije nego što možete pristupiti lekcijama u ovom modulu.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowLockedDialog(false)}
          >
            Zatvori
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
