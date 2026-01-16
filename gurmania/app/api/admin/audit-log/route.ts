import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

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
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "25");
    const action = searchParams.get("action") || "";
    const entityType = searchParams.get("entityType") || "";
    const userId = searchParams.get("userId") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const search = searchParams.get("search") || "";

    // Build where clause
    const where: {
      action?: string;
      entityType?: string;
      userId?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
      OR?: Array<{
        user?: {
          OR?: Array<{
            name?: { contains: string; mode: 'insensitive' };
            email?: { contains: string; mode: 'insensitive' };
          }>;
        };
        ipAddress?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    if (action && action !== "all") {
      where.action = action;
    }

    if (entityType && entityType !== "all") {
      where.entityType = entityType;
    }

    if (userId && userId !== "all") {
      where.userId = userId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add 1 day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lte = endDate;
      }
    }

    if (search) {
      where.OR = [
        {
          user: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        { ipAddress: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build query with cursor pagination
    const queryOptions: {
      where: typeof where;
      take: number;
      orderBy: { createdAt: 'desc' };
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
            image: true;
            role: true;
          };
        };
      };
      cursor?: { id: string };
      skip?: number;
    } = {
      where,
      take: limit + 1, // Get one extra to determine if there are more
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1; // Skip the cursor
    }

    const auditLogs = await prisma.auditLog.findMany(queryOptions);

    // Check if there are more results
    const hasMore = auditLogs.length > limit;
    const logs = hasMore ? auditLogs.slice(0, limit) : auditLogs;
    const nextCursor = hasMore ? logs[logs.length - 1].id : null;

    return NextResponse.json({
      logs,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Greška pri dohvaćanju audit logova" },
      { status: 500 }
    );
  }
}
