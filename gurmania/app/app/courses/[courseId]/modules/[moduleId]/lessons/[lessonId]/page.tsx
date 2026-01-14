import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Clock, ChefHat, AlertTriangle, CheckCircle2, PlayCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{
    courseId: string;
    moduleId: string;
    lessonId: string;
  }>;
}

async function getLessonData(lessonId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/lessons/${lessonId}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch lesson');
  }

  return res.json();
}

export default async function LessonPage({ params }: PageProps) {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const { lessonId } = await params;
  const data = await getLessonData(lessonId);
  const { lesson, progress, quizPassed } = data;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/app">Početna</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/app/courses/${lesson.module.course.id}`}>
              {lesson.module.course.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/app/courses/${lesson.module.course.id}/modules/${lesson.module.id}`}>
              {lesson.module.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{lesson.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Lesson Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-muted-foreground text-lg">{lesson.description}</p>
            )}
          </div>
          {progress.completed && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Dovršeno
            </Badge>
          )}
        </div>

        {/* Lesson Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {lesson.durationMin && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{lesson.durationMin} min</span>
            </div>
          )}
          {lesson.prepTimeMin && (
            <div className="flex items-center gap-1">
              <ChefHat className="w-4 h-4" />
              <span>Priprema: {lesson.prepTimeMin} min</span>
            </div>
          )}
          {lesson.cookTimeMin && (
            <div className="flex items-center gap-1">
              <ChefHat className="w-4 h-4" />
              <span>Kuhanje: {lesson.cookTimeMin} min</span>
            </div>
          )}
          {lesson.difficulty && (
            <Badge variant="secondary">{lesson.difficulty}</Badge>
          )}
          {lesson.cuisineType && (
            <Badge variant="outline">{lesson.cuisineType}</Badge>
          )}
        </div>

        {/* Allergen Tags */}
        {lesson.allergenTags && lesson.allergenTags.length > 0 && (
          <div className="flex items-center gap-2 mt-4">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium">Alergeni:</span>
            <div className="flex gap-2">
              {lesson.allergenTags.map((tag: string) => (
                <Badge key={tag} variant="destructive" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Section */}
          {lesson.videoUrl && (
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={lesson.videoUrl}
                    controls
                    className="w-full h-full"
                    poster="/placeholder-video.jpg"
                  >
                    Vaš preglednik ne podržava video tag.
                  </video>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Steps Section */}
          {lesson.steps && (
            <Card>
              <CardHeader>
                <CardTitle>Koraci pripreme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div
                    dangerouslySetInnerHTML={{ __html: lesson.steps }}
                    className="space-y-4"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quiz Section */}
          {lesson.quiz && (
            <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-orange-600" />
                  {lesson.quiz.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {quizPassed ? (
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Prošli ste kviz!</span>
                    </div>
                  ) : (
                    <>
                      <p>Testirajte svoje znanje nakon što pogledate lekciju.</p>
                      {lesson.quiz.passingScore !== null && (
                        <p className="mt-2">
                          <span className="font-medium">Minimalni prolazni rezultat:</span>{' '}
                          {lesson.quiz.passingScore}%
                        </p>
                      )}
                    </>
                  )}
                </div>
                <Button asChild className="w-full sm:w-auto">
                  <Link href={`/app/quiz/${lesson.quiz.id}`}>
                    {quizPassed ? 'Pokušaj ponovno' : 'Pokreni kviz'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ingredients */}
          {lesson.ingredients && lesson.ingredients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sastojci</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {lesson.ingredients.map((ingredient: any) => (
                    <li key={ingredient.id} className="flex justify-between text-sm">
                      <span>{ingredient.name}</span>
                      <span className="text-muted-foreground">
                        {ingredient.quantity} {ingredient.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Progress Info */}
          {!progress.completed && lesson.quiz && (
            <Card className="bg-blue-50/50 border-blue-200 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  <strong>Napomena:</strong> Morate proći kviz kako biste označili ovu lekciju kao dovršenu.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
