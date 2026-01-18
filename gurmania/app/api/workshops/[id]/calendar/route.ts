import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

function formatIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
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
        instructor: { select: { name: true } },
      },
    });

    if (!workshop) {
      return NextResponse.json({ error: "Radionica nije pronađena" }, { status: 404 });
    }

    const start = workshop.startTime;
    const durationMinutes = workshop.durationMin || 60;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const joinUrl = `${appUrl}/app/workshops/${workshop.id}`;

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Gurmania//Radionice//HR",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${workshop.id}@gurmania`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${workshop.title}`,
      `DESCRIPTION:${(workshop.description || "Live radionica").replace(/\n/g, " ")}`,
      `LOCATION:${joinUrl}`,
      `URL:${joinUrl}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename=radionica-${workshop.id}.ics`,
      },
    });
  } catch (error) {
    console.error("Error generating calendar:", error);
    return NextResponse.json(
      { error: "Greška pri generiranju kalendara" },
      { status: 500 }
    );
  }
}
