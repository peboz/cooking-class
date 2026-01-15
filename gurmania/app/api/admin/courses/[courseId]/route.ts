import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { Prisma } from "@/app/generated/prisma/client";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
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

    const { courseId } = await context.params;
    const body = await request.json();
    const { published, deleted } = body;

    // Get current course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Tečaj nije pronađen" },
        { status: 404 }
      );
    }

    const updateData: { deletedAt?: Date; published?: boolean } = {};
    const auditLogs: { userId: string; action: string; entityType: string; entityId: string; metadata: Prisma.InputJsonValue }[] = [];

    // Handle soft delete
    if (deleted === true) {
      updateData.deletedAt = new Date();
      updateData.published = false; // Also unpublish when deleting

      auditLogs.push({
        userId: session.user.id,
        action: "COURSE_DELETED",
        entityType: "Course",
        entityId: courseId,
        metadata: {
          courseTitle: course.title,
          instructorName: course.instructor.name,
          instructorEmail: course.instructor.email,
        },
      });
    }

    // Handle publish/unpublish toggle
    if (published !== undefined && !deleted) {
      updateData.published = published;

      auditLogs.push({
        userId: session.user.id,
        action: published ? "COURSE_PUBLISHED" : "COURSE_UNPUBLISHED",
        entityType: "Course",
        entityId: courseId,
        metadata: {
          courseTitle: course.title,
          instructorName: course.instructor.name,
          previousStatus: course.published,
        },
      });
    }

    // Update course
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
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
      },
    });

    // Create audit logs
    if (auditLogs.length > 0) {
      await prisma.auditLog.createMany({
        data: auditLogs,
      });
    }

    return NextResponse.json({ course: updatedCourse });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Greška pri ažuriranju tečaja" },
      { status: 500 }
    );
  }
}
