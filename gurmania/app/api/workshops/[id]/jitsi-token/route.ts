import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

function getJitsiDomain() {
  const baseUrl = process.env.NEXT_PUBLIC_JITSI_BASE_URL || "https://meet.jit.si";
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl.replace(/^https?:\/\//, "");
  }
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

    const workshop = await prisma.workshop.findUnique({ where: { id } });
    if (!workshop) {
      return NextResponse.json({ error: "Radionica nije pronađena" }, { status: 404 });
    }

    const isInstructor = workshop.instructorId === session.user.id || session.user.role === "ADMIN";
    if (!isInstructor) {
      return NextResponse.json({ error: "Nedovoljna prava" }, { status: 403 });
    }

    const appId = process.env.JITSI_JWT_APP_ID;
    const appSecret = process.env.JITSI_JWT_APP_SECRET;

    if (!appId || !appSecret) {
      return NextResponse.json({ error: "JWT konfiguracija nedostaje" }, { status: 500 });
    }

    const domain = getJitsiDomain();
    const roomName = `gurmania-${workshop.id}`;
    const now = Math.floor(Date.now() / 1000);

    const token = jwt.sign(
      {
        aud: "jitsi",
        iss: appId,
        sub: domain,
        room: roomName,
        exp: now + 2 * 60 * 60,
        nbf: now - 10,
        context: {
          user: {
            name: session.user.name || "Instruktor",
            email: session.user.email || "",
          },
          features: {
            moderator: true,
          },
        },
      },
      appSecret
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error creating Jitsi token:", error);
    return NextResponse.json(
      { error: "Greška pri kreiranju tokena" },
      { status: 500 }
    );
  }
}
