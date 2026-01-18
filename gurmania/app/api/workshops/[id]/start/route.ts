import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

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

    const workshop = await prisma.workshop.findUnique({ where: { id } });
    if (!workshop) {
      return NextResponse.json({ error: "Radionica nije pronađena" }, { status: 404 });
    }

    const isInstructor = workshop.instructorId === session.user.id || session.user.role === "ADMIN";
    if (!isInstructor) {
      return NextResponse.json({ error: "Nedovoljna prava" }, { status: 403 });
    }

    const startedAt = (workshop as { startedAt?: Date | null }).startedAt;
    if (startedAt) {
      return NextResponse.json({ startedAt });
    }

    const updated = await prisma.workshop.update({
      where: { id },
      data: { startedAt: new Date() } as never,
    });

    return NextResponse.json({ startedAt: (updated as { startedAt?: Date | null }).startedAt });
  } catch (error) {
    console.error("Error starting workshop:", error);
    return NextResponse.json(
      { error: "Greška pri označavanju početka radionice" },
      { status: 500 }
    );
  }
}
