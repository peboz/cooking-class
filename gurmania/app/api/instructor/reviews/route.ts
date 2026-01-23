import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const instructorId = session.user.id;

    // Fetch all reviews for instructor's courses
    const courses = await prisma.course.findMany({
      where: {
        instructorId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        reviews: {
          where: {
            targetType: 'COURSE',
          },
          select: {
            id: true,
            rating: true,
            comment: true,
            photoUrl: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        title: 'asc',
      },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
