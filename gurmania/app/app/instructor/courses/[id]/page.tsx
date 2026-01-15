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
import { ModuleDialog } from '@/components/module-dialog';
import { DragSortableList } from '@/components/drag-sortable-list';
import { DIFFICULTY_LEVELS, CUISINE_TYPES } from '@/lib/constants';
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Upload,
  Loader2,
  BookOpen,
  Video,
  AlertCircle,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  order: number;
  published: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  cuisineType: string | null;
  tags: string[];
  published: boolean;
  modules: Module[];
  media?: { id: string; url: string; type: string }[];
}

export default function CourseEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'EASY',
    cuisineType: '',
    tags: '',
  });

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}`);
      const data = await response.json();
      
      if (response.ok) {
        setCourse(data.course);
        setFormData({
          title: data.course.title,
          description: data.course.description || '',
          difficulty: data.course.difficulty,
          cuisineType: data.course.cuisineType || '',
          tags: data.course.tags.join(', '),
        });
      } else {
        setError(data.error || 'Tečaj nije pronađen');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      setError('Greška prilikom učitavanja tečaja');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/instructor/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Došlo je do greške');
        return;
      }

      await loadCourse();
    } catch (err) {
      setError('Greška prilikom spremanja');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!course) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !course.published }),
      });

      if (response.ok) {
        await loadCourse();
      }
    } catch (err) {
      console.error('Error toggling publish:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj tečaj? Ova akcija se ne može poništiti.')) {
      return;
    }

    try {
      const response = await fetch(`/api/instructor/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/app/instructor/courses');
      }
    } catch (err) {
      console.error('Error deleting course:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await loadCourse();
      }
    } catch (err) {
      console.error('Error uploading image:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleModulesReorder = async (modules: Module[]) => {
    const updatedModules = modules.map((mod, index) => ({
      ...mod,
      order: index,
    }));
    
    setCourse(course ? { ...course, modules: updatedModules } : null);

    try {
      await fetch(`/api/instructor/courses/${courseId}/modules/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modules: updatedModules.map((m) => ({ id: m.id, order: m.order })),
        }),
      });
    } catch (err) {
      console.error('Error reordering modules:', err);
      await loadCourse();
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj modul i sve njegove lekcije?')) {
      return;
    }

    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/modules/${moduleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadCourse();
      }
    } catch (err) {
      console.error('Error deleting module:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error && !course) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!course) return null;

  const thumbnail = course.media?.find(m => m.type === 'IMAGE');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app/instructor/courses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Uredi tečaj</h1>
            <p className="text-muted-foreground">
              {course.title}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={course.published ? 'outline' : 'default'}
            onClick={handlePublishToggle}
            disabled={saving}
            className="gap-2"
          >
            {course.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {course.published ? 'Sakrij' : 'Objavi'}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Course Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalji tečaja</CardTitle>
          <CardDescription>Osnovne informacije o tečaju</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Thumbnail */}
          <div className="space-y-2">
            <Label>Naslovna slika</Label>
            {thumbnail ? (
              <div className="relative w-full max-w-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnail.url} alt="Course thumbnail" className="rounded-lg w-full" />
                <label htmlFor="thumbnail-upload" className="absolute bottom-2 right-2">
                  <Button variant="secondary" size="sm" disabled={uploadingImage} asChild>
                    <span className="cursor-pointer gap-2">
                      {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Promijeni
                    </span>
                  </Button>
                </label>
              </div>
            ) : (
              <label htmlFor="thumbnail-upload" className="block">
                <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-orange-600 transition-colors cursor-pointer">
                  {uploadingImage ? (
                    <Loader2 className="h-12 w-12 mx-auto text-muted-foreground animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Kliknite za upload naslovne slike
                      </p>
                    </>
                  )}
                </div>
              </label>
            )}
            <input
              id="thumbnail-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Naziv *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
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

          <div className="space-y-2">
            <Label htmlFor="tags">Oznake</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Odvojeno zarezom"
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Spremi promjene
          </Button>
        </CardContent>
      </Card>

      {/* Modules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Moduli i lekcije</CardTitle>
              <CardDescription>Organizirajte sadržaj tečaja</CardDescription>
            </div>
            <Button onClick={() => { setEditingModule(null); setModuleDialogOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Dodaj modul
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {course.modules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4" />
              <p>Nema još modula. Dodajte prvi modul za početak.</p>
            </div>
          ) : (
            <DragSortableList
              items={course.modules}
              onReorder={handleModulesReorder}
              getId={(module) => module.id}
              renderItem={(module) => (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                        {module.description && (
                          <CardDescription>{module.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setEditingModule(module); setModuleDialogOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteModule(module.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {module.lessons.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-4">
                        Nema lekcija u ovom modulu
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {module.lessons.map((lesson) => (
                          <Link
                            key={lesson.id}
                            href={`/app/instructor/courses/${courseId}/modules/${module.id}/lessons/${lesson.id}`}
                            className="block"
                          >
                            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors">
                              <div className="flex items-center gap-2">
                                <Video className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{lesson.title}</span>
                                {lesson.published && (
                                  <Badge variant="secondary" className="text-xs">Objavljeno</Badge>
                                )}
                              </div>
                              <Edit className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    <Link href={`/app/instructor/courses/${courseId}/modules/${module.id}/lessons/new`}>
                      <Button variant="outline" size="sm" className="w-full mt-4 gap-2">
                        <Plus className="h-4 w-4" />
                        Dodaj lekciju
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            />
          )}
        </CardContent>
      </Card>

      <ModuleDialog
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
        onSuccess={loadCourse}
        courseId={courseId}
        module={editingModule}
      />
    </div>
  );
}
