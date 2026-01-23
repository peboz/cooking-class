import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

const allowedStatuses = ["PENDING", "APPROVED", "REJECTED"] as const;

type ReviewStatus = (typeof allowedStatuses)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Neautorizirano" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nemate dozvolu pristupa" }, { status: 403 });
    }

    const { reviewId } = await params;
    const body = await request.json();
    const status = body?.status as ReviewStatus | undefined;

    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Neispravan status" }, { status: 400 });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { status },
    });

    return NextResponse.json({ review: updated });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json({ error: "Greška pri spremanju" }, { status: 500 });
  }
}
