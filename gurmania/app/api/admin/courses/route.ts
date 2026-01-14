import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { Difficulty } from "@/app/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Neautorizirano" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nemate dozvolu pristupa" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const published = searchParams.get("published") || "";
    const difficulty = searchParams.get("difficulty") || "";
    const cuisineType = searchParams.get("cuisineType") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      deletedAt: null;
      OR?: { title?: { contains: string; mode: 'insensitive' }; description?: { contains: string; mode: 'insensitive' } }[];
      published?: boolean;
      difficulty?: Difficulty;
      cuisineType?: string;
    } = {
      deletedAt: null, // Exclude soft-deleted courses
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (published === "published") {
      where.published = true;
    } else if (published === "unpublished") {
      where.published = false;
    }

    if (difficulty && difficulty !== "all") {
      where.difficulty = difficulty.toUpperCase() as Difficulty;
    }

    if (cuisineType) {
      where.cuisineType = cuisineType;
    }

    // Get total count
    const total = await prisma.course.count({ where });

    // Get courses with pagination
    const courses = await prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            modules: true,
            reviews: true,
          },
        },
      },
    });

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Greška pri dohvaćanju tečajeva" },
      { status: 500 }
    );
  }
}
