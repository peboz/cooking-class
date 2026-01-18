import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { ReservationStatus, SkillLevel } from "@/app/generated/prisma/client";

function getJitsiBaseUrl() {
  return process.env.NEXT_PUBLIC_JITSI_BASE_URL || "https://meet.jit.si";
}

function buildRoomName(workshopId: string) {
  return `gurmania-${workshopId}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautorizirano" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const mine = searchParams.get("mine") === "true";
    const includePast = searchParams.get("includePast") === "true";
    const courseId = searchParams.get("courseId") || undefined;

    const now = new Date();
    const pastCutoff = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const where: {
      instructorId?: string;
      startTime?: { gte: Date };
      courseId?: string;
    } = {};

    if (mine) {
      where.instructorId = session.user.id;
    }

    if (courseId) {
      where.courseId = courseId;
    }

    if (!includePast) {
      where.startTime = { gte: pastCutoff };
    }

    const workshops = await prisma.workshop.findMany({
      where,
      orderBy: { startTime: "asc" },
      include: {
        instructor: {
          select: { id: true, name: true, image: true, email: true },
        },
        course: {
          select: { id: true, title: true },
        },
        reservations: {
          where: { status: ReservationStatus.RESERVED },
          select: { userId: true },
        },
        requiredLessons: {
          include: {
            lesson: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    const requiredLessonIds = Array.from(
      new Set(
        workshops.flatMap((workshop) =>
          workshop.requiredLessons.map((requirement) => requirement.lessonId)
        )
      )
    );

    const completedLessons = requiredLessonIds.length
      ? await prisma.progress.findMany({
          where: {
            userId: session.user.id,
            lessonId: { in: requiredLessonIds },
            completed: true,
          },
          select: { lessonId: true },
        })
      : [];

    const completedLessonIds = new Set(completedLessons.map((entry) => entry.lessonId));

    const data = workshops
      .map((workshop) => {
        const reservedCount = workshop.reservations.length;
        const isReserved = workshop.reservations.some((r) => r.userId === session.user?.id);
        const isInstructor = workshop.instructorId === session.user?.id || session.user?.role === "ADMIN";
        const missingLessons = workshop.requiredLessons
          .filter((requirement) => !completedLessonIds.has(requirement.lessonId))
          .map((requirement) => requirement.lesson);

        const startedAt = (workshop as { startedAt?: Date | null }).startedAt;

        const durationMinutes = workshop.durationMin ?? 60;
        const endTime = new Date(workshop.startTime.getTime() + durationMinutes * 60 * 1000);
        const hasStarted = now >= workshop.startTime;
        const hasEnded = now > endTime;

        if (!isInstructor) {
          if (hasEnded) return null;
          if (hasStarted && !isReserved) return null;
        }

        return {
          id: workshop.id,
          title: workshop.title,
          description: workshop.description,
          startTime: workshop.startTime,
          startedAt,
          endTime,
          durationMin: workshop.durationMin,
          capacity: workshop.capacity,
          skillLevel: workshop.skillLevel,
          prerequisites: workshop.prerequisites,
          streamUrl: workshop.streamUrl,
          recordingUrl: workshop.recordingUrl,
          course: workshop.course,
          instructor: workshop.instructor,
          requiredLessons: workshop.requiredLessons.map((requirement) => requirement.lesson),
          missingLessons,
          reservedCount,
          isReserved,
          isInstructor,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ workshops: data });
  } catch (error) {
    console.error("Error fetching workshops:", error);
    return NextResponse.json(
      { error: "Greška pri dohvaćanju radionica" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautorizirano" }, { status: 401 });
    }

    const isInstructor = session.user.role === "INSTRUCTOR" || session.user.role === "ADMIN";
    if (!isInstructor) {
      return NextResponse.json({ error: "Nedovoljna prava" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      startTime,
      durationMin,
      capacity,
      skillLevel,
      prerequisites,
      courseId,
      requiredLessonIds,
    } = body as {
      title?: string;
      description?: string;
      startTime?: string;
      durationMin?: number;
      capacity?: number;
      skillLevel?: SkillLevel;
      prerequisites?: string;
      courseId?: string | null;
      requiredLessonIds?: string[];
    };

    if (!title || !startTime || !skillLevel) {
      return NextResponse.json(
        { error: "Nedostaju obavezna polja" },
        { status: 400 }
      );
    }

    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true },
      });

      if (!course) {
        return NextResponse.json({ error: "Tečaj nije pronađen" }, { status: 404 });
      }

      if (session.user.role !== "ADMIN" && course.instructorId !== session.user.id) {
        return NextResponse.json({ error: "Nedovoljna prava" }, { status: 403 });
      }
    }

    let validatedLessonIds: string[] = [];
    if (requiredLessonIds && requiredLessonIds.length > 0) {
      const lessons = await prisma.lesson.findMany({
        where: {
          id: { in: requiredLessonIds },
        },
        select: { id: true, module: { select: { courseId: true } } },
      });

      validatedLessonIds = lessons.map((lesson) => lesson.id);

      if (courseId) {
        const allMatchCourse = lessons.every((lesson) => lesson.module.courseId === courseId);
        if (!allMatchCourse) {
          return NextResponse.json(
            { error: "Odabrane lekcije ne pripadaju odabranom tečaju" },
            { status: 400 }
          );
        }
      }
    }

    const workshop = await prisma.workshop.create({
      data: {
        instructorId: session.user.id,
        courseId: courseId || null,
        title,
        description: description || null,
        startTime: new Date(startTime),
        durationMin: durationMin || null,
        capacity: capacity || null,
        skillLevel,
        prerequisites: prerequisites || null,
        requiredLessons: validatedLessonIds.length
          ? {
              createMany: {
                data: validatedLessonIds.map((lessonId) => ({ lessonId })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
    });

    const roomName = buildRoomName(workshop.id);
    const streamUrl = `${getJitsiBaseUrl()}/${roomName}`;

    const updated = await prisma.workshop.update({
      where: { id: workshop.id },
      data: { streamUrl },
    });

    return NextResponse.json({ workshop: updated }, { status: 201 });
  } catch (error) {
    console.error("Error creating workshop:", error);
    return NextResponse.json(
      { error: "Greška pri kreiranju radionice" },
      { status: 500 }
    );
  }
}
