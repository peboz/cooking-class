"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Clock, Users } from "lucide-react";
import { SKILL_LEVELS } from "@/lib/constants";
import { toast } from "sonner";

interface Workshop {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  startedAt?: string | null;
  endTime?: string | null;
  durationMin?: number | null;
  capacity?: number | null;
  skillLevel: string;
  prerequisites?: string | null;
  course?: {
    id: string;
    title: string;
  } | null;
  requiredLessons?: Array<{ id: string; title: string }>;
  missingLessons?: Array<{ id: string; title: string }>;
  reservedCount: number;
  isReserved: boolean;
  isInstructor: boolean;
  instructor: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
}

const skillLevelLabels = SKILL_LEVELS.reduce<Record<string, string>>((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

export default function WorkshopsPage() {
  const { data: session } = useSession();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingLessonsDialogOpen, setMissingLessonsDialogOpen] = useState(false);
  const [missingLessons, setMissingLessons] = useState<string[]>([]);
  const [missingLessonsWorkshop, setMissingLessonsWorkshop] = useState<Workshop | null>(null);

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/workshops");
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
  }, []);

  const handleReserve = async (workshop: Workshop) => {
    try {
      const response = await fetch(`/api/workshops/${workshop.id}/reserve`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.missingLessons?.length) {
          setMissingLessons(data.missingLessons);
          setMissingLessonsWorkshop(workshop);
          setMissingLessonsDialogOpen(true);
          return;
        }
        throw new Error(data.error || "Greška pri rezervaciji");
      }

      toast.success("Rezervacija potvrđena");
      fetchWorkshops();
    } catch (error) {
      console.error("Error reserving workshop:", error);
      toast.error(error instanceof Error ? error.message : "Greška pri rezervaciji");
    }
  };

  const handleCancel = async (workshopId: string) => {
    try {
      const response = await fetch(`/api/workshops/${workshopId}/reserve`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Greška pri otkazivanju");
      }

      toast.success("Rezervacija otkazana");
      fetchWorkshops();
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      toast.error(error instanceof Error ? error.message : "Greška pri otkazivanju");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
      <Navbar user={session?.user} isInstructor={session?.user?.role === "INSTRUCTOR" || session?.user?.role === "ADMIN"} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Live radionice</h1>
          <p className="text-muted-foreground">
            Rezervirajte svoje mjesto i pridružite se live kuhanju s instruktorima.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : workshops.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Trenutno nema dostupnih radionica.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workshops.map((workshop) => {
              const start = new Date(workshop.startTime);
              const isFull = workshop.capacity ? workshop.reservedCount >= workshop.capacity : false;
              const canJoin = workshop.isReserved || workshop.isInstructor;

              return (
                <Card key={workshop.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl">{workshop.title}</CardTitle>
                        <CardDescription>
                          {workshop.instructor?.name || "Instruktor"}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{skillLevelLabels[workshop.skillLevel] || workshop.skillLevel}</Badge>
                    </div>
                    {workshop.course && (
                      <Badge variant="outline">{workshop.course.title}</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 flex-1">
                    {workshop.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{workshop.description}</p>
                    )}

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{start.toLocaleString("hr-HR", { dateStyle: "medium", timeStyle: "short" })}</span>
                      </div>
                      {workshop.durationMin && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{workshop.durationMin} min</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>
                          {workshop.reservedCount}/{workshop.capacity ?? "∞"} mjesta
                        </span>
                      </div>
                    </div>

                    {workshop.prerequisites && (
                      <p className="text-xs text-muted-foreground">
                        <strong>Preduvjeti:</strong> {workshop.prerequisites}
                      </p>
                    )}
                    {workshop.requiredLessons && workshop.requiredLessons.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        <strong>Obavezne lekcije:</strong> {workshop.requiredLessons.map((lesson) => lesson.title).join(", ")}
                      </p>
                    )}
                    {workshop.missingLessons && workshop.missingLessons.length > 0 && !workshop.isReserved && (
                      <p className="text-xs text-orange-600">
                        Dovršite lekcije: {workshop.missingLessons.map((lesson) => lesson.title).join(", ")}
                      </p>
                    )}

                    <div className="mt-auto flex flex-col gap-2">
                      <Button
                        variant={workshop.isReserved ? "outline" : "default"}
                        onClick={() =>
                          workshop.isReserved ? handleCancel(workshop.id) : handleReserve(workshop)
                        }
                        disabled={isFull && !workshop.isReserved}
                      >
                        {workshop.isReserved ? "Otkaži rezervaciju" : isFull ? "Popunjeno" : "Rezerviraj mjesto"}
                      </Button>
                      {(workshop.isReserved || workshop.isInstructor) && (
                        <Button variant="secondary" asChild>
                          <Link href={`/api/workshops/${workshop.id}/calendar`}>Dodaj u kalendar</Link>
                        </Button>
                      )}

                      {canJoin && (
                        <Button asChild>
                          <Link href={`/app/workshops/${workshop.id}`}>Otvori radionicu</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />

      <Dialog open={missingLessonsDialogOpen} onOpenChange={setMissingLessonsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preduvjetne lekcije nisu dovršene</DialogTitle>
            <DialogDescription>
              Za rezervaciju mjesta potrebno je završiti sljedeće lekcije:
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {missingLessons.map((lesson) => (
              <li key={lesson}>{lesson}</li>
            ))}
          </ul>
          {missingLessonsWorkshop?.course?.id && (
            <Button asChild>
              <Link href={`/app/courses/${missingLessonsWorkshop.course.id}`}>
                Idi na tečaj
              </Link>
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
