'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface QuizData {
  quiz: {
    id: string;
    title: string;
    passingScore: number | null;
    randomized: boolean;
    lesson: {
      id: string;
      title: string;
      module: {
        id: string;
        title: string;
        course: {
          id: string;
          title: string;
        };
      };
    };
    questions: {
      id: string;
      text: string;
      type: string;
      options: {
        id: string;
        text: string;
      }[];
    }[];
  };
}

interface SubmissionResult {
  submissionId: string;
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  passingScore: number | null;
}

export default function QuizPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ quizId: string }>;
  searchParams: Promise<{ returnUrl?: string }>;
}) {
  const { quizId } = use(params);
  const { returnUrl } = use(searchParams);
  const router = useRouter();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load quiz data
  useEffect(() => {
    async function loadQuiz() {
      try {
        const res = await fetch(`/api/quizzes/${quizId}`);
        if (!res.ok) {
          throw new Error('Failed to load quiz');
        }
        const data: QuizData = await res.json();
        setQuizData(data);

        // Clear localStorage for this quiz (clean session)
        localStorage.removeItem(`quiz_${quizId}_answers`);
        localStorage.removeItem(`quiz_${quizId}_currentQuestion`);

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading quiz:', err);
        setError('Greška pri učitavanju kviza');
        setIsLoading(false);
      }
    }

    loadQuiz();
  }, [quizId]);

  // Auto-save answers to localStorage
  useEffect(() => {
    if (!isLoading && !result) {
      localStorage.setItem(`quiz_${quizId}_answers`, JSON.stringify(answers));
      localStorage.setItem(`quiz_${quizId}_currentQuestion`, currentQuestionIndex.toString());
    }
  }, [answers, currentQuestionIndex, quizId, isLoading, result]);

  const handleAnswerChange = (questionId: string, optionId: string, checked: boolean) => {
    setAnswers((prev) => {
      const currentAnswers = prev[questionId] || [];
      if (checked) {
        // Add option if not already selected
        if (!currentAnswers.includes(optionId)) {
          return { ...prev, [questionId]: [...currentAnswers, optionId] };
        }
      } else {
        // Remove option
        return { ...prev, [questionId]: currentAnswers.filter((id) => id !== optionId) };
      }
      return prev;
    });
  };

  const handleNext = () => {
    if (quizData && currentQuestionIndex < quizData.quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quizData) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit quiz');
      }

      const submissionResult: SubmissionResult = await res.json();
      setResult(submissionResult);

      // Clear localStorage after successful submission
      localStorage.removeItem(`quiz_${quizId}_answers`);
      localStorage.removeItem(`quiz_${quizId}_currentQuestion`);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('Greška pri predaji kviza. Molimo pokušajte ponovno.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    // Reset all state
    setResult(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setError(null);
    
    // Clear localStorage
    localStorage.removeItem(`quiz_${quizId}_answers`);
    localStorage.removeItem(`quiz_${quizId}_currentQuestion`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Učitavanje kviza...</span>
        </div>
      </div>
    );
  }

  if (error && !quizData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Greška</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!quizData) {
    return null;
  }

  const { quiz } = quizData;
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const courseId = quiz.lesson.module.course.id;
  const moduleId = quiz.lesson.module.id;
  const lessonId = quiz.lesson.id;

  // Show results
  if (result) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/app">Početna</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/app/courses/${courseId}`}>
                {quiz.lesson.module.course.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/app/courses/${courseId}/lessons/${lessonId}`}>
                {quiz.lesson.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{quiz.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Rezultati kviza</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              {result.passed ? (
                <>
                  <CheckCircle2 className="w-16 h-16 text-green-600" />
                  <div>
                    <p className="text-3xl font-bold text-green-600">{result.score}%</p>
                    <p className="text-lg font-medium mt-2">Čestitamo! Prošli ste kviz.</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 text-red-600" />
                  <div>
                    <p className="text-3xl font-bold text-red-600">{result.score}%</p>
                    <p className="text-lg font-medium mt-2">Niste prošli kviz.</p>
                  </div>
                </>
              )}

              <div className="text-muted-foreground">
                <p>
                  Točnih odgovora: {result.correctAnswers} od {result.totalQuestions}
                </p>
                {result.passingScore !== null && (
                  <p className="text-sm mt-1">Minimalni prolazni rezultat: {result.passingScore}%</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline">
                <Link href={returnUrl || `/app/courses/${courseId}/lessons/${lessonId}`}>
                  Povratak na lekciju
                </Link>
              </Button>
              <Button onClick={handleRetry}>Pokušaj ponovno</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show quiz
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/app">Početna</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/app/courses/${courseId}`}>
              {quiz.lesson.module.course.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/app/courses/${courseId}/lessons/${lessonId}`}>
              {quiz.lesson.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{quiz.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Quiz Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Pitanje {currentQuestionIndex + 1} od {quiz.questions.length}
          </span>
          {quiz.passingScore !== null && (
            <span>Minimalni prolaz: {quiz.passingScore}%</span>
          )}
        </div>
        <Progress value={progressPercent} className="mt-2" />
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Greška</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.options.map((option) => {
            const isSelected = (answers[currentQuestion.id] || []).includes(option.id);
            return (
              <div
                key={option.id}
                className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleAnswerChange(currentQuestion.id, option.id, !isSelected)}
              >
                <Checkbox
                  id={option.id}
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    handleAnswerChange(currentQuestion.id, option.id, checked as boolean)
                  }
                  className="mt-1"
                />
                <label
                  htmlFor={option.id}
                  className="flex-1 cursor-pointer leading-relaxed"
                >
                  {option.text}
                </label>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Prethodno
        </Button>

        <div className="text-sm text-muted-foreground">
          {answers[currentQuestion.id] && answers[currentQuestion.id].length > 0
            ? `Odabrano: ${answers[currentQuestion.id].length}`
            : 'Nije odabrano'}
        </div>

        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <Button onClick={handleNext}>
            Sljedeće
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Predaja...
              </>
            ) : (
              'Predaj kviz'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
