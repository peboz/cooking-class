import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { Role, Prisma } from "@/app/generated/prisma/client";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await context.params;
    const body = await request.json();
    const { role, isActive } = body;

    // Get current user state
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        instructorProfile: true,
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Korisnik nije pronađen" },
        { status: 404 }
      );
    }

    const updateData: { role?: Role; isActive?: boolean } = {};
    const auditLogs: { userId: string; action: string; entityType: string; entityId: string; metadata: Prisma.InputJsonValue }[] = [];

    // Handle role change
    if (role !== undefined && role !== currentUser.role) {
      updateData.role = role as Role;
      auditLogs.push({
        userId: session.user.id,
        action: "USER_ROLE_CHANGED",
        entityType: "User",
        entityId: userId,
        metadata: {
          oldRole: currentUser.role,
          newRole: role,
        },
      });
    }

    // Handle active status change
    if (isActive !== undefined && isActive !== currentUser.isActive) {
      updateData.isActive = isActive;

      // If deactivating an instructor, hide all their courses
      if (
        !isActive &&
        (currentUser.role === "INSTRUCTOR" || role === "INSTRUCTOR") &&
        currentUser._count.courses > 0
      ) {
        await prisma.course.updateMany({
          where: {
            instructorId: userId,
            published: true,
          },
          data: {
            published: false,
          },
        });

        auditLogs.push({
          userId: session.user.id,
          action: "INSTRUCTOR_COURSES_HIDDEN",
          entityType: "User",
          entityId: userId,
          metadata: {
            coursesAffected: currentUser._count.courses,
          },
        });
      }

      auditLogs.push({
        userId: session.user.id,
        action: isActive ? "USER_ACTIVATED" : "USER_SUSPENDED",
        entityType: "User",
        entityId: userId,
        metadata: {
          previousStatus: currentUser.isActive,
        },
      });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        instructorProfile: {
          select: {
            verified: true,
            verificationStatus: true,
          },
        },
      },
    });

    // Create audit logs
    if (auditLogs.length > 0) {
      await prisma.auditLog.createMany({
        data: auditLogs,
      });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Greška pri ažuriranju korisnika" },
      { status: 500 }
    );
  }
}
