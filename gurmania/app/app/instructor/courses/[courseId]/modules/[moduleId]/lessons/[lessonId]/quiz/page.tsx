'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Trash2, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Question {
  text: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
}

interface QuizFormData {
  title: string;
  passingScore: string;
  randomized: boolean;
  questions: Question[];
}

export default function InstructorQuizPage({
  params,
}: {
  params: { courseId: string; moduleId: string; lessonId: string };
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingQuizId, setExistingQuizId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [moduleTitle, setModuleTitle] = useState<string>('');

  const [formData, setFormData] = useState<QuizFormData>({
    title: '',
    passingScore: '',
    randomized: false,
    questions: [
      {
        text: '',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      },
    ],
  });

  // Load existing quiz if any
  useEffect(() => {
    async function loadData() {
      try {
        // Load lesson info
        const lessonRes = await fetch(`/api/lessons/${params.lessonId}`);
        if (lessonRes.ok) {
          const lessonData = await lessonRes.json();
          setLessonTitle(lessonData.lesson.title);
          setModuleTitle(lessonData.lesson.module.title);
          setCourseTitle(lessonData.lesson.module.course.title);

          if (lessonData.lesson.quiz) {
            // Load existing quiz
            const quizRes = await fetch(`/api/instructor/quizzes/${lessonData.lesson.quiz.id}`);
            if (quizRes.ok) {
              const quizData = await quizRes.json();
              setExistingQuizId(quizData.quiz.id);
              setFormData({
                title: quizData.quiz.title,
                passingScore: quizData.quiz.passingScore?.toString() || '',
                randomized: quizData.quiz.randomized,
                questions: quizData.quiz.questions.map((q: any) => ({
                  text: q.text,
                  options: q.options.map((o: any) => ({
                    text: o.text,
                    isCorrect: o.isCorrect,
                  })),
                })),
              });
            }
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Greška pri učitavanju podataka');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [params.lessonId]);

  const handleAddQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          text: '',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
          ],
        },
      ],
    }));
  };

  const handleRemoveQuestion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleQuestionTextChange = (index: number, text: string) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, text } : q)),
    }));
  };

  const handleAddOption = (questionIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? { ...q, options: [...q.options, { text: '', isCorrect: false }] }
          : q
      ),
    }));
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? { ...q, options: q.options.filter((_, oi) => oi !== optionIndex) }
          : q
      ),
    }));
  };

  const handleOptionTextChange = (questionIndex: number, optionIndex: number, text: string) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: q.options.map((o, oi) => (oi === optionIndex ? { ...o, text } : o)),
            }
          : q
      ),
    }));
  };

  const handleOptionCorrectChange = (
    questionIndex: number,
    optionIndex: number,
    isCorrect: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: q.options.map((o, oi) => (oi === optionIndex ? { ...o, isCorrect } : o)),
            }
          : q
      ),
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) {
      return 'Unesite naslov kviza';
    }

    if (formData.questions.length === 0) {
      return 'Dodajte barem jedno pitanje';
    }

    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i];

      if (!question.text.trim()) {
        return `Unesite tekst za pitanje ${i + 1}`;
      }

      if (question.options.length < 2) {
        return `Pitanje ${i + 1} mora imati barem 2 opcije`;
      }

      const hasCorrectAnswer = question.options.some((o) => o.isCorrect);
      if (!hasCorrectAnswer) {
        return `Pitanje ${i + 1} mora imati barem jedan točan odgovor`;
      }

      for (let j = 0; j < question.options.length; j++) {
        if (!question.options[j].text.trim()) {
          return `Unesite tekst za opciju ${j + 1} u pitanju ${i + 1}`;
        }
      }
    }

    return null;
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        lessonId: params.lessonId,
        title: formData.title,
        passingScore: formData.passingScore ? parseInt(formData.passingScore) : null,
        randomized: formData.randomized,
        questions: formData.questions,
      };

      let res;
      if (existingQuizId) {
        // Update existing quiz
        res = await fetch(`/api/instructor/quizzes/${existingQuizId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new quiz
        res = await fetch('/api/instructor/quizzes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save quiz');
      }

      const data = await res.json();
      if (data.quizId && !existingQuizId) {
        setExistingQuizId(data.quizId);
      }

      setSuccess('Kviz je uspješno spremljen!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving quiz:', err);
      setError(err.message || 'Greška pri spremanju kviza');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingQuizId) return;

    if (!confirm('Jeste li sigurni da želite obrisati ovaj kviz?')) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/instructor/quizzes/${existingQuizId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete quiz');
      }

      router.push(`/app/courses/${params.courseId}/modules/${params.moduleId}/lessons/${params.lessonId}`);
    } catch (err: any) {
      console.error('Error deleting quiz:', err);
      setError(err.message || 'Greška pri brisanju kviza');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Učitavanje...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/app">Početna</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/app/courses/${params.courseId}`}>
              {courseTitle}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/app/courses/${params.courseId}/modules/${params.moduleId}/lessons/${params.lessonId}`}>
              {lessonTitle}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {existingQuizId ? 'Uredi kviz' : 'Novi kviz'}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {existingQuizId ? 'Uredi kviz' : 'Kreiraj kviz'}
        </h1>
        <p className="text-muted-foreground mt-2">Lekcija: {lessonTitle}</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Greška</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-600 bg-green-50 text-green-900">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Uspjeh</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Quiz Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Postavke kviza</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Naslov kviza *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="npr. Test znanja o pripremi tjestenine"
              />
            </div>

            <div>
              <Label htmlFor="passingScore">Minimalni prolazni rezultat (%)</Label>
              <Input
                id="passingScore"
                type="number"
                min="0"
                max="100"
                value={formData.passingScore}
                onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })}
                placeholder="Ostavi prazno za automatski prolaz"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Ako je prazno, svi polaznici automatski prolaze kviz
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="randomized"
                checked={formData.randomized}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, randomized: checked as boolean })
                }
              />
              <Label htmlFor="randomized" className="cursor-pointer">
                Nasumično poredaj pitanja
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Pitanja</h2>
            <Button onClick={handleAddQuestion} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Dodaj pitanje
            </Button>
          </div>

          {formData.questions.map((question, qIndex) => (
            <Card key={qIndex}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Pitanje {qIndex + 1}</CardTitle>
                  {formData.questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveQuestion(qIndex)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`question-${qIndex}`}>Tekst pitanja *</Label>
                  <Textarea
                    id={`question-${qIndex}`}
                    value={question.text}
                    onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                    placeholder="Unesite tekst pitanja..."
                    rows={3}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Opcije odgovora *</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddOption(qIndex)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Dodaj opciju
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Checkbox
                          id={`q${qIndex}-o${oIndex}-correct`}
                          checked={option.isCorrect}
                          onCheckedChange={(checked) =>
                            handleOptionCorrectChange(qIndex, oIndex, checked as boolean)
                          }
                          className="mt-3"
                        />
                        <div className="flex-1">
                          <Label htmlFor={`q${qIndex}-o${oIndex}`} className="text-xs text-muted-foreground">
                            Opcija {oIndex + 1}
                          </Label>
                          <Input
                            id={`q${qIndex}-o${oIndex}`}
                            value={option.text}
                            onChange={(e) =>
                              handleOptionTextChange(qIndex, oIndex, e.target.value)
                            }
                            placeholder="Tekst opcije..."
                          />
                        </div>
                        {question.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOption(qIndex, oIndex)}
                            className="mt-6"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Označite točne odgovore. Možete označiti više opcija kao točne.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div>
            {existingQuizId && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSaving}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Obriši kviz
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              asChild
            >
              <Link href={`/app/courses/${params.courseId}/modules/${params.moduleId}/lessons/${params.lessonId}`}>
                Odustani
              </Link>
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Spremanje...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Spremi kviz
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
