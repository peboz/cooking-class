import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { auth } from '@/auth';

// Create new quiz
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Neovlašteni pristup' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Received quiz creation request:', JSON.stringify(body, null, 2));
    const { lessonId, title, passingScore, randomized, questions } = body;

    if (!lessonId || !title) {
      return NextResponse.json(
        { error: 'Nedostaju obavezna polja' },
        { status: 400 }
      );
    }

    // Validate passingScore
    if (passingScore !== null && passingScore !== undefined) {
      const score = Number(passingScore);
      if (isNaN(score) || score < 0 || score > 100) {
        return NextResponse.json(
          { error: 'Traženi rezultat mora biti broj između 0 i 100' },
          { status: 400 }
        );
      }
    }

    // Verify lesson exists and user is the instructor
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              select: {
                instructorId: true,
              },
            },
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

    if (lesson.module.course.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nemate dozvolu za ovu akciju' },
        { status: 403 }
      );
    }

    // Check if quiz already exists for this lesson
    const existingQuiz = await prisma.quiz.findUnique({
      where: { lessonId },
    });

    if (existingQuiz) {
      return NextResponse.json(
        { error: 'Kviz već postoji za ovu lekciju' },
        { status: 400 }
      );
    }

    // Create quiz with questions and options in a transaction
    const quiz = await prisma.$transaction(
      async (tx) => {
        const newQuiz = await tx.quiz.create({
        data: {
          lessonId,
          title,
          passingScore: passingScore || null,
          randomized: randomized || false,
        },
      });

      if (questions && questions.length > 0) {
        for (const question of questions) {
          const newQuestion = await tx.question.create({
            data: {
              quizId: newQuiz.id,
              text: question.text,
              type: 'MULTIPLE_CHOICE',
            },
          });

          if (question.options && question.options.length > 0) {
            await tx.questionOption.createMany({
              data: question.options.map((opt: { text: string; isCorrect?: boolean }) => ({
                questionId: newQuestion.id,
                text: opt.text,
                isCorrect: opt.isCorrect || false,
              })),
            });
          }
        }
      }

      return newQuiz;
    },
    {
      maxWait: 10000, // 10 seconds max wait
      timeout: 30000, // 30 seconds timeout
    }
  );

    return NextResponse.json({ quizId: quiz.id }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating quiz:', error);
    const errorMessage = error instanceof Error ? error.message : 'Greška pri kreiranju kviza';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
