"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, Plus, Users } from "lucide-react";
import { SKILL_LEVELS } from "@/lib/constants";
import { toast } from "sonner";
import Link from "next/link";

interface Workshop {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  durationMin?: number | null;
  capacity?: number | null;
  skillLevel: string;
  prerequisites?: string | null;
  reservedCount: number;
  course?: {
    id: string;
    title: string;
  } | null;
  requiredLessons?: Array<{ id: string; title: string }>;
}

interface InstructorCourse {
  id: string;
  title: string;
  modules: Array<{
    id: string;
    title: string;
    lessons: Array<{ id: string; title: string }>;
  }>;
}

const skillLevelLabels = SKILL_LEVELS.reduce<Record<string, string>>((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

export default function InstructorWorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMin, setDurationMin] = useState("60");
  const [capacity, setCapacity] = useState("20");
  const [skillLevel, setSkillLevel] = useState<string>(SKILL_LEVELS[0].value);
  const [prerequisites, setPrerequisites] = useState("");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [requiredLessonIds, setRequiredLessonIds] = useState<string[]>([]);

  const startTimeMin = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }, []);

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/workshops?mine=true&includePast=true");
      if (!response.ok) {
        throw new Error("Failed to fetch workshops");
      }
      const data = await response.json();
      setWorkshops(data.workshops || []);
    } catch (error) {
      console.error("Error fetching workshops:", error);
      toast.error("Ne možemo učitati radionice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await fetch("/api/instructor/courses");
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Ne možemo učitati tečajeve");
    } finally {
      setCoursesLoading(false);
    }
  };

  const selectedCourse = courses.find((course) => course.id === courseId);
  const selectedLessons = selectedCourse
    ? selectedCourse.modules.flatMap((module) => module.lessons)
    : [];

  const handleCreate = async () => {
    if (!title || !startTime || !skillLevel) {
      toast.error("Molimo popunite obavezna polja");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/workshops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          startTime,
          durationMin: durationMin ? Number(durationMin) : undefined,
          capacity: capacity ? Number(capacity) : undefined,
          skillLevel,
          prerequisites,
          courseId,
          requiredLessonIds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Greška pri kreiranju radionice");
      }

      toast.success("Radionica je kreirana");
      setTitle("");
      setDescription("");
      setStartTime("");
      setDurationMin("60");
      setCapacity("20");
      setSkillLevel(SKILL_LEVELS[0].value);
      setPrerequisites("");
      setCourseId(null);
      setRequiredLessonIds([]);
      fetchWorkshops();
    } catch (error) {
      console.error("Error creating workshop:", error);
      toast.error(error instanceof Error ? error.message : "Greška pri kreiranju radionice");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (workshopId: string) => {
    try {
      const response = await fetch(`/api/workshops/${workshopId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Greška pri brisanju radionice");
      }

      toast.success("Radionica je obrisana");
      fetchWorkshops();
    } catch (error) {
      console.error("Error deleting workshop:", error);
      toast.error(error instanceof Error ? error.message : "Greška pri brisanju radionice");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live radionice</h1>
        <p className="text-muted-foreground">
          Zakažite i upravljajte live radionicama.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova radionica</CardTitle>
          <CardDescription>Unesite detalje i otvorite radionicu za rezervacije.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Naziv radionice</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Npr. Tehnike pečenja" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Opis</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kratki opis radionice" />
          </div>
          <div className="space-y-2">
            <Label>Datum i vrijeme</Label>
            <Input type="datetime-local" min={startTimeMin} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Trajanje (min)</Label>
            <Input type="number" min={30} value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Kapacitet</Label>
            <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Razina</Label>
            <Select value={skillLevel} onValueChange={setSkillLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Odaberite razinu" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Preduvjeti</Label>
            <Input value={prerequisites} onChange={(e) => setPrerequisites(e.target.value)} placeholder="Npr. Osnovne tehnike noža" />
          </div>
          <div className="space-y-2">
            <Label>Tečaj (opcionalno)</Label>
            <Select value={courseId ?? "none"} onValueChange={(value) => {
              const nextCourseId = value === "none" ? null : value;
              setCourseId(nextCourseId);
              setRequiredLessonIds([]);
            }}>
              <SelectTrigger>
                <SelectValue placeholder={coursesLoading ? "Učitavanje..." : "Odaberite tečaj"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bez tečaja</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedCourse && (
            <div className="space-y-2 md:col-span-2">
              <Label>Obavezne lekcije</Label>
              <ScrollArea className="h-48 rounded-md border p-3">
                <div className="space-y-3">
                  {selectedCourse.modules.map((module) => (
                    <div key={module.id} className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{module.title}</p>
                      <div className="space-y-2">
                        {module.lessons.map((lesson) => {
                          const checked = requiredLessonIds.includes(lesson.id);
                          return (
                            <label key={lesson.id} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) => {
                                  const nextValue = Boolean(value);
                                  setRequiredLessonIds((prev) =>
                                    nextValue
                                      ? [...prev, lesson.id]
                                      : prev.filter((id) => id !== lesson.id)
                                  );
                                }}
                              />
                              <span>{lesson.title}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          <div className="md:col-span-2">
            <Button onClick={handleCreate} disabled={saving} className="gap-2">
              <Plus className="h-4 w-4" />
              {saving ? "Spremanje..." : "Objavi radionicu"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vaše radionice</CardTitle>
          <CardDescription>Pregled statusa i brze akcije.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Učitavanje...</p>
          ) : workshops.length === 0 ? (
            <p className="text-sm text-muted-foreground">Još nemate radionica.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {workshops.map((workshop) => {
                const start = new Date(workshop.startTime);
                return (
                  <Card key={workshop.id} className="border-dashed">
                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg">{workshop.title}</CardTitle>
                          <CardDescription>
                            {start.toLocaleString("hr-HR", { dateStyle: "medium", timeStyle: "short" })}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{skillLevelLabels[workshop.skillLevel] || workshop.skillLevel}</Badge>
                      </div>
                      {workshop.course && (
                        <Badge variant="outline">{workshop.course.title}</Badge>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{start.toLocaleDateString("hr-HR")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{workshop.durationMin ?? 60} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{workshop.reservedCount}/{workshop.capacity ?? "∞"} mjesta</span>
                      </div>
                      {workshop.requiredLessons && workshop.requiredLessons.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          <strong>Obavezne lekcije:</strong> {workshop.requiredLessons.map((lesson) => lesson.title).join(", ")}
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button size="sm" asChild>
                          <Link href={`/app/workshops/${workshop.id}`}>Otvori radionicu</Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/api/workshops/${workshop.id}/calendar`}>Dodaj u kalendar</Link>
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(workshop.id)}>
                          Obriši
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
