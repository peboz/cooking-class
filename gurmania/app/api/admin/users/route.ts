import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { Role } from "@/app/generated/prisma/client";

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
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      OR?: { name?: { contains: string; mode: 'insensitive' }; email?: { contains: string; mode: 'insensitive' } }[];
      role?: Role;
      isActive?: boolean;
    } = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role && role !== "all") {
      where.role = role.toUpperCase() as Role;
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        instructorProfile: {
          select: {
            verified: true,
            verificationStatus: true,
          },
        },
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Greška pri dohvaćanju korisnika" },
      { status: 500 }
    );
  }
}
