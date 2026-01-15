import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId, lessonId, completed } = body;

    if (!courseId || !lessonId || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Nedostaju obavezni parametri' },
        { status: 400 }
      );
    }

    // Verify the lesson exists and belongs to the course
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: {
            courseId: true,
          },
        },
        quiz: {
          select: {
            id: true,
            passingScore: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lekcija nije pronađena' },
        { status: 404 }
      );
    }

    if (lesson.module.courseId !== courseId) {
      return NextResponse.json(
        { error: 'Lekcija ne pripada ovom tečaju' },
        { status: 400 }
      );
    }

    // If marking as completed and lesson has a quiz, check if quiz is passed
    if (completed && lesson.quiz) {
      const submission = await prisma.quizSubmission.findFirst({
        where: {
          quizId: lesson.quiz.id,
          userId: session.user.id,
        },
        orderBy: {
          submittedAt: 'desc',
        },
      });

      // Check if quiz is passed
      let quizPassed = false;
      if (submission) {
        if (lesson.quiz.passingScore === null) {
          // No passing score set, any submission passes
          quizPassed = true;
        } else {
          quizPassed = (submission.score ?? 0) >= lesson.quiz.passingScore;
        }
      }

      if (!quizPassed) {
        return NextResponse.json(
          { error: 'Morate proći kviz prije nego što možete označiti lekciju kao dovršenu' },
          { status: 400 }
        );
      }
    }

    // Find or create progress record for this specific lesson
    let progress = await prisma.progress.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseId,
        lessonId: lessonId,
      },
    });

    if (!progress) {
      // Create new progress record
      progress = await prisma.progress.create({
        data: {
          userId: session.user.id,
          courseId: courseId,
          lessonId: lessonId,
          completed: completed,
          percent: completed ? 100 : 0,
          timeSpentSec: 0,
        },
      });
    } else {
      // Update existing progress
      progress = await prisma.progress.update({
        where: { id: progress.id },
        data: {
          completed: completed,
          percent: completed ? 100 : 0,
          lastAccessedAt: new Date(),
        },
      });
    }

    // Get all completed lessons for this course
    const allProgress = await prisma.progress.findMany({
      where: {
        userId: session.user.id,
        courseId: courseId,
        completed: true,
      },
      select: {
        lessonId: true,
      },
    });

    const completedLessonIds = allProgress.map(p => p.lessonId).filter(Boolean) as string[];

    return NextResponse.json({
      success: true,
      progress: {
        id: progress.id,
        completedLessons: completedLessonIds,
        completed: progress.completed,
        timeSpentSec: progress.timeSpentSec,
      },
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju napretka' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Neautorizirano' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Nedostaje courseId parametar' },
        { status: 400 }
      );
    }

    // Get all progress records for this course
    const allProgress = await prisma.progress.findMany({
      where: {
        userId: session.user.id,
        courseId: courseId,
      },
    });

    const completedLessonIds = allProgress
      .filter(p => p.completed && p.lessonId)
      .map(p => p.lessonId) as string[];

    const totalTimeSpent = allProgress.reduce((acc, p) => acc + p.timeSpentSec, 0);

    return NextResponse.json({
      completedLessons: completedLessonIds,
      completed: false, // Course completion would need separate logic
      timeSpentSec: totalTimeSpent,
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju napretka' },
      { status: 500 }
    );
  }
}
