"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Users, Loader2 } from "lucide-react";
import { JitsiMeetingEmbed } from "@/components/jitsi-meeting";
import Link from "next/link";
import { SKILL_LEVELS } from "@/lib/constants";
import { toast } from "sonner";

interface WorkshopDetail {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  startedAt?: string | null;
  durationMin?: number | null;
  capacity?: number | null;
  skillLevel: string;
  prerequisites?: string | null;
  streamUrl?: string | null;
  course?: {
    id: string;
    title: string;
  } | null;
  requiredLessons?: Array<{ id: string; title: string }>;
  missingLessons?: Array<{ id: string; title: string }>;
  instructor: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
  reservedCount: number;
  isReserved: boolean;
  isInstructor: boolean;
}

const skillLevelLabels = SKILL_LEVELS.reduce<Record<string, string>>((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

export default function WorkshopLivePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [workshop, setWorkshop] = useState<WorkshopDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [jitsiToken, setJitsiToken] = useState<string | null>(null);

  const fetchWorkshop = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workshops/${params.id}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch workshop");
      }
      const data = await response.json();
      setWorkshop(data.workshop);
    } catch (error) {
      console.error("Error fetching workshop:", error);
      toast.error(error instanceof Error ? error.message : "Ne možemo učitati radionicu");
      router.push("/app/workshops");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    fetchWorkshop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchWorkshop();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!workshop?.isInstructor) {
      setJitsiToken(null);
      return;
    }

    const fetchToken = async () => {
      try {
        const response = await fetch(`/api/workshops/${workshop.id}/jitsi-token`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Greška pri dohvaćanju tokena");
        }
        const data = await response.json();
        setJitsiToken(data.token);
      } catch (error) {
        console.error("Error fetching Jitsi token:", error);
        toast.error(error instanceof Error ? error.message : "Greška pri dohvaćanju tokena");
      }
    };

    fetchToken();
  }, [workshop?.id, workshop?.isInstructor]);

  const handleStartWorkshop = async () => {
    if (!workshop?.id) return;
    try {
      const response = await fetch(`/api/workshops/${workshop.id}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Greška pri pokretanju radionice");
      }

      await fetchWorkshop();
      toast.success("Radionica je započela");
    } catch (error) {
      console.error("Error starting workshop:", error);
      toast.error(error instanceof Error ? error.message : "Greška pri pokretanju radionice");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
        <Navbar user={session?.user} isInstructor={session?.user?.role === "INSTRUCTOR" || session?.user?.role === "ADMIN"} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
        <Navbar user={session?.user} isInstructor={session?.user?.role === "INSTRUCTOR" || session?.user?.role === "ADMIN"} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Radionica nije pronađena.
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const start = new Date(workshop.startTime);
  const canJoin = workshop.isReserved || workshop.isInstructor;
  const isLive = !!workshop.startedAt;
  const now = new Date();
  const minutesUntilStart = Math.ceil((start.getTime() - now.getTime()) / 60000);
  const hasScheduledStartPassed = minutesUntilStart <= 0;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900">
      <Navbar user={session?.user} isInstructor={session?.user?.role === "INSTRUCTOR" || session?.user?.role === "ADMIN"} />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{workshop.title}</CardTitle>
                <CardDescription>{workshop.instructor?.name || "Instruktor"}</CardDescription>
              </div>
              <Badge variant="secondary">{skillLevelLabels[workshop.skillLevel] || workshop.skillLevel}</Badge>
            </div>
            {workshop.course && (
              <Badge variant="outline" className="w-fit">
                {workshop.course.title}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {workshop.description && (
              <p className="text-sm text-muted-foreground">{workshop.description}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
            {workshop.missingLessons && workshop.missingLessons.length > 0 && !workshop.isReserved && !workshop.isInstructor && (
              <p className="text-xs text-orange-600">
                Dovršite lekcije: {workshop.missingLessons.map((lesson) => lesson.title).join(", ")}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              {(workshop.isReserved || workshop.isInstructor) && (
                <Button asChild>
                  <Link href={`/api/workshops/${workshop.id}/calendar`}>Dodaj u kalendar</Link>
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href="/app/workshops">Povratak na radionice</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {canJoin && isLive ? (
          <JitsiMeetingEmbed
            roomName={`gurmania-${workshop.id}`}
            displayName={session?.user?.name}
            email={session?.user?.email}
            subject={workshop.title}
            jwt={workshop.isInstructor ? jitsiToken : null}
          />
        ) : workshop.isInstructor ? (
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <p className="text-muted-foreground">
                Radionica još nije započela. Kad budete spremni, kliknite za pokretanje.
              </p>
              <Button onClick={handleStartWorkshop}>Započni radionicu</Button>
            </CardContent>
          </Card>
        ) : canJoin ? (
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                <p className="text-muted-foreground">
                  {hasScheduledStartPassed
                    ? "Radionica će započeti uskoro. Instruktor se još nije priključio."
                    : "Radionica još nije započela. Pristup će biti omogućen kada instruktor uđe."}
                </p>
              </div>
              {!hasScheduledStartPassed && (
                <div className="text-sm text-muted-foreground">
                  Početak za <span className="font-medium text-foreground">{minutesUntilStart} min</span>
                </div>
              )}
              <Button variant="outline" onClick={fetchWorkshop}>Provjeri ponovo</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <p className="text-muted-foreground">
                Pristup radionici imaju samo prijavljeni polaznici s rezervacijom.
              </p>
              <Button asChild>
                <Link href="/app/workshops">Rezerviraj mjesto</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
