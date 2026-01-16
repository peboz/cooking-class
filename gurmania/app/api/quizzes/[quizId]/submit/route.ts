import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { auth } from '@/auth';

interface SubmissionData {
  answers: {
    [questionId: string]: string[]; // Array of selected option IDs
  };
}

export async function POST(
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
    const body: SubmissionData = await request.json();

    if (!body.answers || typeof body.answers !== 'object') {
      return NextResponse.json(
        { error: 'Nevažeći format odgovora' },
        { status: 400 }
      );
    }

    // Fetch quiz with questions and correct answers
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          select: {
            id: true,
            moduleId: true,
            module: {
              select: {
                courseId: true,
              },
            },
          },
        },
        questions: {
          include: {
            options: true,
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

    // Calculate score
    let correctAnswers = 0;
    const totalQuestions = quiz.questions.length;

    for (const question of quiz.questions) {
      const userAnswers = body.answers[question.id] || [];
      const correctOptions = question.options
        .filter((opt) => opt.isCorrect)
        .map((opt) => opt.id);

      // Check if user selected exactly the correct options
      const isCorrect =
        userAnswers.length === correctOptions.length &&
        userAnswers.every((id) => correctOptions.includes(id)) &&
        correctOptions.every((id) => userAnswers.includes(id));

      if (isCorrect) {
        correctAnswers++;
      }
    }

    // Calculate percentage score
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Determine if passed
    let passed = false;
    if (quiz.passingScore === null) {
      // No passing score set, everyone passes
      passed = true;
    } else {
      passed = score >= quiz.passingScore;
    }

    // Save submission
    const submission = await prisma.quizSubmission.create({
      data: {
        quizId: quiz.id,
        userId: session.user.id,
        score,
      },
    });

    // If passed, mark lesson as completed
    if (passed) {
      await prisma.progress.upsert({
        where: {
          userId_courseId_lessonId: {
            userId: session.user.id,
            courseId: quiz.lesson.module.courseId,
            lessonId: quiz.lesson.id,
          },
        },
        create: {
          userId: session.user.id,
          courseId: quiz.lesson.module.courseId,
          lessonId: quiz.lesson.id,
          completed: true,
          percent: 100,
        },
        update: {
          completed: true,
          percent: 100,
          lastAccessedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      submissionId: submission.id,
      score,
      passed,
      correctAnswers,
      totalQuestions,
      passingScore: quiz.passingScore,
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json(
      { error: 'Greška pri predaji kviza' },
      { status: 500 }
    );
  }
}
