"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TiptapEditor } from '@/components/tiptap-editor';
import { YouTubeEmbed } from '@/components/youtube-embed';
import { IngredientForm, IngredientData } from '@/components/ingredient-form';
import { DIFFICULTY_LEVELS, CUISINE_TYPES, ALLERGENS } from '@/lib/constants';
import { isValidYouTubeUrl } from '@/lib/video';
import {
  ArrowLeft,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  Video,
  ClipboardList,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  steps: string | null;
  prepTimeMin: number | null;
  cookTimeMin: number | null;
  difficulty: string;
  cuisineType: string | null;
  allergenTags: string[];
  published: boolean;
  ingredients: {
    id: string;
    quantity: number | null;
    unit: string | null;
    optional: boolean;
    ingredient: {
      id: string;
      name: string;
    };
  }[];
  module: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
    };
  };
}

export default function LessonEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const moduleId = params.moduleId as string;
  const lessonId = params.lessonId as string;
  const isNew = lessonId === 'new';

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [showVideoPreview, setShowVideoPreview] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    steps: '',
    prepTimeMin: '',
    cookTimeMin: '',
    difficulty: 'EASY',
    cuisineType: '',
    published: false,
  });

  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<IngredientData[]>([]);

  useEffect(() => {
    if (!isNew) {
      loadLesson();
    }
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
      const data = await response.json();
      
      if (response.ok) {
        setLesson(data.lesson);
        setFormData({
          title: data.lesson.title,
          description: data.lesson.description || '',
          videoUrl: data.lesson.videoUrl || '',
          steps: data.lesson.steps || '',
          prepTimeMin: data.lesson.prepTimeMin?.toString() || '',
          cookTimeMin: data.lesson.cookTimeMin?.toString() || '',
          difficulty: data.lesson.difficulty,
          cuisineType: data.lesson.cuisineType || '',
          published: data.lesson.published,
        });
        setVideoUrlInput(data.lesson.videoUrl || '');
        setShowVideoPreview(!!data.lesson.videoUrl && isValidYouTubeUrl(data.lesson.videoUrl));
        setSelectedAllergens(data.lesson.allergenTags || []);
        setIngredients(
          data.lesson.ingredients.map((ing: { ingredient: { name: string }; quantity: number | null; unit: string | null; optional: boolean }) => ({
            name: ing.ingredient.name,
            quantity: ing.quantity,
            unit: ing.unit || 'g',
            optional: ing.optional,
          }))
        );
      } else {
        setError(data.error || 'Lekcija nije pronađena');
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
      setError('Greška prilikom učitavanja lekcije');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publish = false) => {
    setSaving(true);
    setError('');

    // Validation
    if (!formData.title.trim()) {
      setError('Naziv lekcije je obavezan');
      setSaving(false);
      return;
    }

    if (formData.videoUrl && !isValidYouTubeUrl(formData.videoUrl)) {
      setError('Nevažeći YouTube URL');
      setSaving(false);
      return;
    }

    try {
      const url = isNew
        ? `/api/instructor/courses/${courseId}/modules/${moduleId}/lessons`
        : `/api/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`;
      
      const method = isNew ? 'POST' : 'PATCH';

      const payload = {
        ...formData,
        prepTimeMin: formData.prepTimeMin ? parseInt(formData.prepTimeMin) : null,
        cookTimeMin: formData.cookTimeMin ? parseInt(formData.cookTimeMin) : null,
        allergenTags: selectedAllergens,
        ingredients: ingredients.map(ing => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          optional: ing.optional,
          allergenFlags: [],
        })),
        published: publish ? true : formData.published,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Došlo je do greške');
        setSaving(false);
        return;
      }

      if (isNew) {
        // Redirect to edit page of newly created lesson
        router.push(`/app/instructor/courses/${courseId}/modules/${moduleId}/lessons/${data.lesson.id}`);
      } else {
        await loadLesson();
      }
    } catch (err) {
      setError('Greška prilikom spremanja');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Jeste li sigurni da želite obrisati ovu lekciju?')) {
      return;
    }

    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push(`/app/instructor/courses/${courseId}`);
      }
    } catch (err) {
      console.error('Error deleting lesson:', err);
    }
  };

  const handleVideoUrlUpdate = () => {
    if (isValidYouTubeUrl(videoUrlInput)) {
      setFormData({ ...formData, videoUrl: videoUrlInput });
      setShowVideoPreview(true);
    } else {
      setShowVideoPreview(false);
    }
  };

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens(prev =>
      prev.includes(allergen)
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const backUrl = `/app/instructor/courses/${courseId}`;
  const courseName = lesson?.module.course.title || 'Tečaj';
  const moduleName = lesson?.module.title || 'Modul';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={backUrl}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isNew ? 'Nova lekcija' : 'Uredi lekciju'}
            </h1>
            <p className="text-muted-foreground">
              {courseName} / {moduleName}
            </p>
          </div>
        </div>
        {!isNew && (
          <div className="flex gap-2">
            <Link href={`/app/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/quiz`}>
              <Button variant="outline">
                <ClipboardList className="h-4 w-4 mr-2" />
                Upravljaj kvizom
              </Button>
            </Link>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Osnovne informacije</CardTitle>
          <CardDescription>Naziv i opis lekcije</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Naziv lekcije *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="npr. Kako napraviti spaghetti carbonara"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Kratak opis</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Kratak opis lekcije..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Video */}
      <Card>
        <CardHeader>
          <CardTitle>Video</CardTitle>
          <CardDescription>YouTube video URL</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="videoUrl">YouTube URL</Label>
            <div className="flex gap-2">
              <Input
                id="videoUrl"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <Button type="button" onClick={handleVideoUrlUpdate} variant="outline">
                <Video className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showVideoPreview && formData.videoUrl && (
            <div className="mt-4">
              <Label>Pregled</Label>
              <div className="mt-2">
                <YouTubeEmbed videoUrl={formData.videoUrl} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipe Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalji recepta</CardTitle>
          <CardDescription>Vrijeme pripreme, težina i tip kuhinje</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prepTimeMin">Vrijeme pripreme (min)</Label>
              <Input
                id="prepTimeMin"
                type="number"
                value={formData.prepTimeMin}
                onChange={(e) => setFormData({ ...formData, prepTimeMin: e.target.value })}
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cookTimeMin">Vrijeme kuhanja (min)</Label>
              <Input
                id="cookTimeMin"
                type="number"
                value={formData.cookTimeMin}
                onChange={(e) => setFormData({ ...formData, cookTimeMin: e.target.value })}
                placeholder="45"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Težina</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuisineType">Tip kuhinje</Label>
              <Select
                value={formData.cuisineType}
                onValueChange={(value) => setFormData({ ...formData, cuisineType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite" />
                </SelectTrigger>
                <SelectContent>
                  {CUISINE_TYPES.map((cuisine) => (
                    <SelectItem key={cuisine} value={cuisine}>
                      {cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipe Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Koraci pripreme</CardTitle>
          <CardDescription>Detaljan opis kako pripremiti jelo</CardDescription>
        </CardHeader>
        <CardContent>
          <TiptapEditor
            content={formData.steps}
            onChange={(html) => setFormData({ ...formData, steps: html })}
            placeholder="1. Kuhajte tjesteninu u oslanoj vodi...&#10;2. U tiganj dodajte maslinovo ulje..."
          />
        </CardContent>
      </Card>

      {/* Ingredients */}
      <Card>
        <CardHeader>
          <CardTitle>Sastojci</CardTitle>
          <CardDescription>Lista potrebnih sastojaka</CardDescription>
        </CardHeader>
        <CardContent>
          <IngredientForm ingredients={ingredients} onChange={setIngredients} />
        </CardContent>
      </Card>

      {/* Allergens */}
      <Card>
        <CardHeader>
          <CardTitle>Alergeni</CardTitle>
          <CardDescription>Označite alergene prisutne u receptu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((allergen) => (
              <Badge
                key={allergen}
                variant={selectedAllergens.includes(allergen) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleAllergen(allergen)}
              >
                {allergen}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Spremi kao skicu
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          {lesson?.published ? 'Spremi' : 'Objavi'}
        </Button>
      </div>
    </div>
  );
}
