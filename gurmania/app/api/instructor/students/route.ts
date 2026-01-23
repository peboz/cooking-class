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

    // Fetch all students enrolled in instructor's courses
    const enrollments = await prisma.progress.findMany({
      where: {
        course: {
          instructorId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        percent: true,
        completed: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Group enrollments by student
    const studentMap = new Map<string, {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      courses: Array<{
        id: string;
        title: string;
        percent: number;
        completed: boolean;
      }>;
    }>();

    enrollments.forEach((enrollment) => {
      // Skip if user or course is null
      if (!enrollment.user || !enrollment.course) return;
      
      const userId = enrollment.user.id;
      if (!studentMap.has(userId)) {
        studentMap.set(userId, {
          id: enrollment.user.id,
          name: enrollment.user.name,
          email: enrollment.user.email,
          image: enrollment.user.image,
          courses: [],
        });
      }
      
      const student = studentMap.get(userId)!;
      // Only add course if not already added (prevent duplicates from lesson-level progress)
      const courseExists = student.courses.some(c => c.id === enrollment.course!.id);
      if (!courseExists) {
        student.courses.push({
          id: enrollment.course.id,
          title: enrollment.course.title,
          percent: enrollment.percent,
          completed: enrollment.completed,
        });
      }
    });

    const students = Array.from(studentMap.values());

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
