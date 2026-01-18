import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { ReservationStatus } from "@/app/generated/prisma/client";
import { sendWorkshopReminderEmail } from "@/lib/email";

const WINDOW_MINUTES = 5;

function buildTimeWindow(targetMinutesAhead: number) {
  const now = new Date();
  const target = new Date(now.getTime() + targetMinutesAhead * 60 * 1000);
  const start = new Date(target.getTime() - WINDOW_MINUTES * 60 * 1000);
  const end = new Date(target.getTime() + WINDOW_MINUTES * 60 * 1000);
  return { start, end, target };
}

async function sendReminderForWindow(label: "24H" | "1H" | "10M", minutesAhead: number) {
  const { start, end, target } = buildTimeWindow(minutesAhead);

  const workshops = await prisma.workshop.findMany({
    where: {
      startTime: { gte: start, lte: end },
    },
    include: {
      instructor: { select: { id: true, name: true, email: true } },
      reservations: {
        where: { status: ReservationStatus.RESERVED },
        select: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  for (const workshop of workshops) {
    const notificationType = `WORKSHOP_REMINDER_${label}`;

    const recipients = [
      {
        id: workshop.instructor.id,
        name: workshop.instructor.name || "Instruktor",
        email: workshop.instructor.email,
        role: "INSTRUCTOR" as const,
      },
      ...workshop.reservations.map((reservation) => ({
        id: reservation.user.id,
        name: reservation.user.name || "Polaznik",
        email: reservation.user.email,
        role: "ATTENDEE" as const,
      })),
    ].filter((user) => user.email);

    for (const recipient of recipients) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: recipient.id,
          type: notificationType,
          metadata: {
            path: ["workshopId"],
            equals: workshop.id,
          },
        },
      });

      if (existingNotification) continue;

      await sendWorkshopReminderEmail({
        recipientEmail: recipient.email as string,
        recipientName: recipient.name,
        role: recipient.role,
        workshop: {
          id: workshop.id,
          title: workshop.title,
          startTime: workshop.startTime,
          durationMin: workshop.durationMin || 60,
          instructorName: workshop.instructor.name || "Instruktor",
        },
        reminderLabel: label,
      });

      await prisma.notification.create({
        data: {
          userId: recipient.id,
          type: notificationType,
          title: `Podsjetnik: ${workshop.title}`,
          message: `Radionica počinje ${label === "24H" ? "za 24 sata" : label === "1H" ? "za 1 sat" : "za 10 minuta"}.`,
          scheduledFor: target,
          metadata: { workshopId: workshop.id, reminder: label },
        },
      });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const secret = process.env.WORKSHOP_REMINDER_CRON_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Neautorizirano" }, { status: 401 });
    }

    await Promise.all([
      sendReminderForWindow("24H", 24 * 60),
      sendReminderForWindow("1H", 60),
      sendReminderForWindow("10M", 10),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error sending workshop reminders:", error);
    return NextResponse.json(
      { error: "Greška pri slanju podsjetnika" },
      { status: 500 }
    );
  }
}
