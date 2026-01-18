import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { ReservationStatus } from "@/app/generated/prisma/client";

export async function POST(
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

    if (workshop.capacity && workshop.reservations.length >= workshop.capacity) {
      return NextResponse.json(
        { error: "Nema više slobodnih mjesta" },
        { status: 409 }
      );
    }

    const requiredLessonIds = workshop.requiredLessons.map((requirement) => requirement.lessonId);
    if (requiredLessonIds.length > 0) {
      const completedLessons = await prisma.progress.findMany({
        where: {
          userId: session.user.id,
          lessonId: { in: requiredLessonIds },
          completed: true,
        },
        select: { lessonId: true },
      });

      const completedLessonIds = new Set(completedLessons.map((entry) => entry.lessonId));
      const missingLessons = workshop.requiredLessons
        .filter((requirement) => !completedLessonIds.has(requirement.lessonId))
        .map((requirement) => requirement.lesson.title);

      if (missingLessons.length > 0) {
        return NextResponse.json(
          {
            error: "Morate dovršiti preduvjetne lekcije prije rezervacije.",
            missingLessons,
          },
          { status: 403 }
        );
      }
    }

    const existing = await prisma.reservation.findUnique({
      where: {
        workshopId_userId: {
          workshopId: id,
          userId: session.user.id,
        },
      },
    });

    if (existing && existing.status === ReservationStatus.RESERVED) {
      return NextResponse.json({ ok: true, reservation: existing });
    }

    const reservation = existing
      ? await prisma.reservation.update({
          where: { id: existing.id },
          data: { status: ReservationStatus.RESERVED },
        })
      : await prisma.reservation.create({
          data: {
            workshopId: id,
            userId: session.user.id,
            status: ReservationStatus.RESERVED,
          },
        });

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    console.error("Error reserving workshop:", error);
    return NextResponse.json(
      { error: "Greška pri rezervaciji radionice" },
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

    const reservation = await prisma.reservation.findUnique({
      where: {
        workshopId_userId: {
          workshopId: id,
          userId: session.user.id,
        },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Rezervacija nije pronađena" }, { status: 404 });
    }

    const updated = await prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: ReservationStatus.CANCELLED },
    });

    return NextResponse.json({ reservation: updated });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    return NextResponse.json(
      { error: "Greška pri otkazivanju rezervacije" },
      { status: 500 }
    );
  }
}
