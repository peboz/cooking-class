"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Video, Users, ArrowRight, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

interface Workshop {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  durationMin?: number | null;
  capacity?: number | null;
  skillLevel: string;
  prerequisites?: string | null;
  reservedCount: number;
  course?: {
    id: string;
    title: string;
  } | null;
  recordingUrl?: string | null;
}

const viewOptions = [
  { value: "day", label: "Dan" },
  { value: "week", label: "Tjedan" },
  { value: "month", label: "Mjesec" },
];

function formatDate(date: Date) {
  return date.toLocaleDateString("hr-HR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("hr-HR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toCalendarDate(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function buildGoogleCalendarUrl(options: {
  title: string;
  details: string;
  start: Date;
  end: Date;
  location?: string;
  url?: string;
}) {
  const { title, details, start, end, location, url } = options;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: url ? `${details}\n\n${url}` : details,
    dates: `${toCalendarDate(start)}/${toCalendarDate(end)}`,
  });

  if (location) {
    params.set("location", location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcsFile(options: {
  title: string;
  description: string;
  start: Date;
  end: Date;
  location?: string;
  url?: string;
}) {
  const { title, description, start, end, location, url } = options;
  const now = new Date();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gurmania//Instructor Schedule//HR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${now.getTime()}-${Math.random().toString(36).slice(2)}@gurmania`,
    `DTSTAMP:${toCalendarDate(now)}`,
    `DTSTART:${toCalendarDate(start)}`,
    `DTEND:${toCalendarDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}${url ? `\\n\\n${url}` : ""}`,
    location ? `LOCATION:${location}` : undefined,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getRelativeLabel(date: Date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (diff === 0) return "Danas";
  if (diff === 1) return "Sutra";
  if (diff === -1) return "Jučer";
  return formatDate(date);
}

function startOfWeek(date: Date) {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = base.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  base.setDate(base.getDate() + diff);
  return base;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMonthTitle(date: Date) {
  return date.toLocaleDateString("hr-HR", {
    month: "long",
    year: "numeric",
  });
}

function getStatus(start: Date, end: Date | null) {
  const now = new Date();
  const safeEnd = end ?? new Date(start.getTime() + 60 * 60 * 1000);

  if (now < start) return "Uskoro";
  if (now >= start && now <= safeEnd) return "U tijeku";
  return "Završeno";
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "U tijeku":
      return "bg-emerald-500 text-white";
    case "Uskoro":
      return "bg-orange-500 text-white";
    case "Završeno":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function InstructorSchedulePage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("month");
  const [anchorDate, setAnchorDate] = useState(() => new Date());

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/workshops?mine=true&includePast=true");
      if (!response.ok) {
        throw new Error("Neuspjelo dohvaćanje rasporeda");
      }
      const data = await response.json();
      setWorkshops(data.workshops || []);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      toast.error("Ne možemo učitati raspored");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const workshopsByDay = useMemo(() => {
    const groups = new Map<string, Workshop[]>();
    workshops.forEach((workshop) => {
      const start = new Date(workshop.startTime);
      const key = getDateKey(start);
      const existing = groups.get(key) || [];
      existing.push(workshop);
      groups.set(key, existing);
    });
    return groups;
  }, [workshops]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayKey = getDateKey(now);
    const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingCount = workshops.filter((workshop) => new Date(workshop.startTime) >= now).length;
    const todayCount = workshops.filter((workshop) => getDateKey(new Date(workshop.startTime)) === todayKey).length;
    const weekCount = workshops.filter((workshop) => {
      const start = new Date(workshop.startTime);
      return start >= now && start <= next7;
    }).length;
    const pastCount = workshops.filter((workshop) => new Date(workshop.startTime) < now).length;

    return { upcomingCount, todayCount, weekCount, pastCount };
  }, [workshops]);

  const monthStart = useMemo(() => startOfMonth(anchorDate), [anchorDate]);
  const monthGridStart = useMemo(() => startOfWeek(monthStart), [monthStart]);
  const monthDays = useMemo(
    () => Array.from({ length: 42 }, (_, index) => addDays(monthGridStart, index)),
    [monthGridStart]
  );

  const weekStart = useMemo(() => startOfWeek(anchorDate), [anchorDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart]
  );

  const dayWorkshops = useMemo(() => {
    const key = getDateKey(anchorDate);
    return (workshopsByDay.get(key) || []).sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [anchorDate, workshopsByDay]);

  const getExportPayload = (workshop: Workshop) => {
    const start = new Date(workshop.startTime);
    const duration = workshop.durationMin ?? 60;
    const end = workshop.endTime ? new Date(workshop.endTime) : new Date(start.getTime() + duration * 60 * 1000);
    const location = "Gurmania (online)";
    const details = workshop.description || "Live radionica na platformi Gurmania.";
    const workshopUrl = `${window.location.origin}/app/workshops/${workshop.id}`;

    return {
      start,
      end,
      location,
      details,
      workshopUrl,
    };
  };

  const openGoogleCalendar = (workshop: Workshop) => {
    const { start, end, location, details, workshopUrl } = getExportPayload(workshop);
    const url = buildGoogleCalendarUrl({
      title: workshop.title,
      details,
      start,
      end,
      location,
      url: workshopUrl,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const downloadIcs = (workshop: Workshop) => {
    const { start, end, location, details, workshopUrl } = getExportPayload(workshop);
    const ics = buildIcsFile({
      title: workshop.title,
      description: details,
      start,
      end,
      location,
      url: workshopUrl,
    });
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gurmania-${workshop.id}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleNavigate = (direction: "prev" | "next") => {
    if (view === "day") {
      setAnchorDate((prev) => addDays(prev, direction === "prev" ? -1 : 1));
      return;
    }
    if (view === "week") {
      setAnchorDate((prev) => addDays(prev, direction === "prev" ? -7 : 7));
      return;
    }
    setAnchorDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + (direction === "prev" ? -1 : 1), 1));
  };

  const viewTitle = useMemo(() => {
    if (view === "day") {
      return getRelativeLabel(anchorDate);
    }
    if (view === "week") {
      const start = weekStart;
      const end = addDays(weekStart, 6);
      return `${start.toLocaleDateString("hr-HR", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("hr-HR", { day: "numeric", month: "short" })}`;
    }
    return formatMonthTitle(anchorDate);
  }, [anchorDate, view, weekStart]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raspored</h1>
          <p className="text-muted-foreground">
            Pregledajte sve radionice po datumu i upravljajte svojim terminima.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/app/instructor/workshops">
              Upravljanje radionicama
            </Link>
          </Button>
          <Button asChild>
            <Link href="/app/instructor/workshops">
              Kreiraj radionicu
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-14" />
              </CardHeader>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardDescription>Nadolazeće</CardDescription>
                <CardTitle className="text-3xl">{stats.upcomingCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Danas</CardDescription>
                <CardTitle className="text-3xl">{stats.todayCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Sljedećih 7 dana</CardDescription>
                <CardTitle className="text-3xl">{stats.weekCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Prošle</CardDescription>
                <CardTitle className="text-3xl">{stats.pastCount}</CardTitle>
              </CardHeader>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Kalendarski prikaz</CardTitle>
            <CardDescription>
              Pregled po danu, tjednu ili mjesecu. Kliknite termin za detalje.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {viewOptions.map((option) => (
              <Button
                key={option.value}
                variant={view === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setView(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="font-medium text-foreground">{viewTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => handleNavigate("prev")}
                aria-label="Prethodni period">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAnchorDate(new Date())}>
                Danas
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleNavigate("next")}
                aria-label="Sljedeći period">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))}
            </div>
          ) : view === "day" ? (
            <div className="space-y-4">
              {dayWorkshops.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  Nema radionica za odabrani dan.
                </div>
              ) : (
                dayWorkshops.map((workshop) => {
                  const start = new Date(workshop.startTime);
                  const end = workshop.endTime ? new Date(workshop.endTime) : null;
                  const status = getStatus(start, end);
                  const isFull = workshop.capacity ? workshop.reservedCount >= workshop.capacity : false;

                  return (
                    <Card key={workshop.id} className="border-l-4 border-l-orange-500">
                      <CardHeader className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <CardTitle className="text-lg">{workshop.title}</CardTitle>
                          <Badge className={getStatusBadgeClass(status)}>{status}</Badge>
                        </div>
                        {workshop.course && (
                          <Badge variant="outline">{workshop.course.title}</Badge>
                        )}
                        {workshop.description && (
                          <CardDescription className="line-clamp-2">
                            {workshop.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(start)}</span>
                            {workshop.durationMin && (
                              <span className="text-xs">· {workshop.durationMin} min</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>
                              {workshop.reservedCount}/{workshop.capacity ?? "∞"} mjesta
                            </span>
                            {isFull && (
                              <Badge variant="secondary" className="text-[10px]">Puno</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/app/workshops/${workshop.id}`}>
                              Detalji radionice
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openGoogleCalendar(workshop)}>
                            Dodaj u Google Calendar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => downloadIcs(workshop)}>
                            Preuzmi iCal
                          </Button>
                          {workshop.recordingUrl && (
                            <Button asChild size="sm" variant="secondary">
                              <Link href={workshop.recordingUrl} target="_blank" rel="noreferrer">
                                <Video className="mr-2 h-4 w-4" />
                                Snimka
                              </Link>
                            </Button>
                          )}
                          <Button asChild size="sm">
                            <Link href={`/app/workshops/${workshop.id}`}>
                              Otvori sobu
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          ) : view === "week" ? (
            <div className="grid gap-4 lg:grid-cols-7">
              {weekDays.map((day) => {
                const key = getDateKey(day);
                const items = (workshopsByDay.get(key) || []).sort(
                  (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                );
                const isToday = isSameDay(day, new Date());

                return (
                  <div key={key} className="rounded-lg border p-3 space-y-3">
                    <div className={`flex items-center justify-between text-sm ${isToday ? "text-orange-600 font-semibold" : "text-muted-foreground"}`}>
                      <span>{day.toLocaleDateString("hr-HR", { weekday: "short" })}</span>
                      <span>{day.getDate()}</span>
                    </div>
                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nema termina</p>
                      ) : (
                        items.map((workshop) => {
                          const start = new Date(workshop.startTime);
                          const status = getStatus(start, workshop.endTime ? new Date(workshop.endTime) : null);
                          return (
                            <Link key={workshop.id} href={`/app/workshops/${workshop.id}`}>
                              <div className="rounded-md border px-2 py-1 text-xs hover:border-orange-200 hover:bg-orange-50/60 transition">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium line-clamp-1">{workshop.title}</span>
                                  <Badge className={getStatusBadgeClass(status)}>{status}</Badge>
                                </div>
                                <div className="mt-1 flex items-center justify-between text-muted-foreground">
                                  <span>{formatTime(start)}</span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="rounded-sm p-0.5 hover:bg-muted"
                                        aria-label="Izvoz u kalendar"
                                      >
                                        <MoreHorizontal className="h-3 w-3" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={(event) => {
                                        event.preventDefault();
                                        openGoogleCalendar(workshop);
                                      }}>
                                        Dodaj u Google Calendar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(event) => {
                                        event.preventDefault();
                                        downloadIcs(workshop);
                                      }}>
                                        Preuzmi iCal
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-7 text-xs text-muted-foreground">
                {["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"].map((day) => (
                  <div key={day} className="px-2 py-1 text-center font-medium">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {monthDays.map((day) => {
                  const key = getDateKey(day);
                  const items = (workshopsByDay.get(key) || []).sort(
                    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                  );
                  const isCurrentMonth = day.getMonth() === anchorDate.getMonth();
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={key}
                      className={`min-h-[110px] rounded-lg border p-2 text-xs ${
                        isCurrentMonth ? "bg-background" : "bg-muted/40 text-muted-foreground"
                      } ${isToday ? "border-orange-400 shadow-sm" : "border-border"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${isToday ? "text-orange-600" : ""}`}>
                          {day.getDate()}
                        </span>
                        {items.length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {items.length}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        {items.slice(0, 2).map((workshop) => (
                          <div key={workshop.id} className="flex items-center justify-between gap-1 rounded-md bg-orange-50/70 px-1 py-0.5 text-[10px] text-orange-700">
                            <Link href={`/app/workshops/${workshop.id}`} className="line-clamp-1 hover:text-orange-800">
                              {formatTime(new Date(workshop.startTime))} · {workshop.title}
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="rounded-sm p-0.5 hover:bg-orange-100"
                                  aria-label="Izvoz u kalendar"
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openGoogleCalendar(workshop)}>
                                  Dodaj u Google Calendar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => downloadIcs(workshop)}>
                                  Preuzmi iCal
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                        {items.length > 2 && (
                          <div className="text-[10px] text-muted-foreground">
                            +{items.length - 2} više
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
