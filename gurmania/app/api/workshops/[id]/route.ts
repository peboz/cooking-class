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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautorizirano" }, { status: 401 });
    }

    const workshop = await prisma.workshop.findUnique({
      where: { id },
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

    if (!workshop) {
      return NextResponse.json({ error: "Radionica nije pronađena" }, { status: 404 });
    }

    const reservedCount = workshop.reservations.length;
    const isReserved = workshop.reservations.some((r) => r.userId === session.user?.id);
    const isInstructor = workshop.instructorId === session.user?.id || session.user?.role === "ADMIN";

    const durationMinutes = workshop.durationMin ?? 60;
    const endTime = new Date(workshop.startTime.getTime() + durationMinutes * 60 * 1000);
    const now = new Date();
    const hasStarted = now >= workshop.startTime;
    const hasEnded = now > endTime;

    if (!isInstructor) {
      if (hasEnded) {
        return NextResponse.json({ error: "Radionica je završila" }, { status: 404 });
      }
      if (hasStarted && !isReserved) {
        return NextResponse.json(
          { error: "Radionica je već započela" },
          { status: 403 }
        );
      }
    }

    const requiredLessonIds = workshop.requiredLessons.map((requirement) => requirement.lessonId);
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
    const missingLessons = workshop.requiredLessons
      .filter((requirement) => !completedLessonIds.has(requirement.lessonId))
      .map((requirement) => requirement.lesson);

    const startedAt = (workshop as { startedAt?: Date | null }).startedAt;

    return NextResponse.json({
      workshop: {
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
      },
    });
  } catch (error) {
    console.error("Error fetching workshop:", error);
    return NextResponse.json(
      { error: "Greška pri dohvaćanju radionice" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautorizirano" }, { status: 401 });
    }

    const workshop = await prisma.workshop.findUnique({ where: { id } });
    if (!workshop) {
      return NextResponse.json({ error: "Radionica nije pronađena" }, { status: 404 });
    }

    const isOwner = workshop.instructorId === session.user.id || session.user.role === "ADMIN";
    if (!isOwner) {
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

    let validatedLessonIds: string[] | null = null;
    if (requiredLessonIds) {
      const lessons = await prisma.lesson.findMany({
        where: {
          id: { in: requiredLessonIds },
        },
        select: { id: true, module: { select: { courseId: true } } },
      });

      validatedLessonIds = lessons.map((lesson) => lesson.id);

      const expectedCourseId = courseId ?? workshop.courseId;
      if (expectedCourseId) {
        const allMatchCourse = lessons.every((lesson) => lesson.module.courseId === expectedCourseId);
        if (!allMatchCourse) {
          return NextResponse.json(
            { error: "Odabrane lekcije ne pripadaju odabranom tečaju" },
            { status: 400 }
          );
        }
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (validatedLessonIds) {
        await tx.workshopLessonRequirement.deleteMany({ where: { workshopId: id } });
        if (validatedLessonIds.length > 0) {
          await tx.workshopLessonRequirement.createMany({
            data: validatedLessonIds.map((lessonId) => ({ workshopId: id, lessonId })),
            skipDuplicates: true,
          });
        }
      }

      return tx.workshop.update({
        where: { id },
        data: {
          title: title ?? workshop.title,
          description: description ?? workshop.description,
          startTime: startTime ? new Date(startTime) : workshop.startTime,
          durationMin: durationMin ?? workshop.durationMin,
          capacity: capacity ?? workshop.capacity,
          skillLevel: skillLevel ?? workshop.skillLevel,
          prerequisites: prerequisites ?? workshop.prerequisites,
          courseId: courseId ?? workshop.courseId,
        },
      });
    });

    if (!updated.streamUrl) {
      const roomName = buildRoomName(updated.id);
      const streamUrl = `${getJitsiBaseUrl()}/${roomName}`;
      await prisma.workshop.update({
        where: { id: updated.id },
        data: { streamUrl },
      });
    }

    return NextResponse.json({ workshop: updated });
  } catch (error) {
    console.error("Error updating workshop:", error);
    return NextResponse.json(
      { error: "Greška pri ažuriranju radionice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautorizirano" }, { status: 401 });
    }

    const workshop = await prisma.workshop.findUnique({ where: { id } });
    if (!workshop) {
      return NextResponse.json({ error: "Radionica nije pronađena" }, { status: 404 });
    }

    const isOwner = workshop.instructorId === session.user.id || session.user.role === "ADMIN";
    if (!isOwner) {
      return NextResponse.json({ error: "Nedovoljna prava" }, { status: 403 });
    }

    await prisma.workshop.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting workshop:", error);
    return NextResponse.json(
      { error: "Greška pri brisanju radionice" },
      { status: 500 }
    );
  }
}
