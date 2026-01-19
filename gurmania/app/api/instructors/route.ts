import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { Role } from "@/app/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    // Build where clause for instructor search
    const where = {
      role: Role.INSTRUCTOR,
      isActive: true,
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }),
    };

    const instructors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        image: true,
        instructorProfile: {
          select: {
            verified: true,
          },
        },
      },
      orderBy: [
        { instructorProfile: { verified: "desc" } },
        { name: "asc" },
      ],
      take: 20,
    });

    return NextResponse.json({
      instructors: instructors.map((instructor) => ({
        id: instructor.id,
        name: instructor.name,
        image: instructor.image,
        verified: instructor.instructorProfile?.verified || false,
      })),
    });
  } catch (error) {
    console.error("Error fetching instructors:", error);
    return NextResponse.json(
      { error: "Failed to fetch instructors" },
      { status: 500 }
    );
  }
}
