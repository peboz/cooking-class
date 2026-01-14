import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Neovlašteni pristup' },
        { status: 401 }
      );
    }

    const { quizId } = await params;

    // Fetch quiz with questions and options (without revealing correct answers)
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
        questions: {
          include: {
            options: {
              select: {
                id: true,
                text: true,
                // Do NOT include isCorrect for students
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Kviz nije pronađen' },
        { status: 404 }
      );
    }

    // Check if user has access to this course
    // TODO: Add enrollment check when implemented

    // Shuffle questions if randomized
    let questions = quiz.questions;
    if (quiz.randomized) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        randomized: quiz.randomized,
        lesson: {
          id: quiz.lesson.id,
          title: quiz.lesson.title,
          module: {
            id: quiz.lesson.module.id,
            title: quiz.lesson.module.title,
            course: {
              id: quiz.lesson.module.course.id,
              title: quiz.lesson.module.course.title,
            },
          },
        },
        questions: questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options.map((o) => ({
            id: o.id,
            text: o.text,
          })),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju kviza' },
      { status: 500 }
    );
  }
}
