import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { auth } from '@/auth';

// Get quiz details for editing
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

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
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

    // Verify user is the instructor
    if (quiz.lesson.module.course.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nemate dozvolu za ovu akciju' },
        { status: 403 }
      );
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju kviza' },
      { status: 500 }
    );
  }
}

// Update quiz
export async function PATCH(
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
    const body = await request.json();
    const { title, passingScore, randomized, questions } = body;

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

    // Verify quiz exists and user is the instructor
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
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
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Kviz nije pronađen' },
        { status: 404 }
      );
    }

    if (quiz.lesson.module.course.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nemate dozvolu za ovu akciju' },
        { status: 403 }
      );
    }

    // Update quiz in transaction
    await prisma.$transaction(async (tx) => {
      // Update quiz basic info
      await tx.quiz.update({
        where: { id: quizId },
        data: {
          title,
          passingScore: passingScore || null,
          randomized: randomized || false,
        },
      });

      if (questions) {
        // Delete existing questions and options
        await tx.question.deleteMany({
          where: { quizId },
        });

        // Create new questions and options
        for (const question of questions) {
          const newQuestion = await tx.question.create({
            data: {
              quizId,
              text: question.text,
              type: 'MULTIPLE_CHOICE',
            },
          });

          if (question.options && question.options.length > 0) {
            await tx.questionOption.createMany({
              data: question.options.map((opt: any) => ({
                questionId: newQuestion.id,
                text: opt.text,
                isCorrect: opt.isCorrect || false,
              })),
            });
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating quiz:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju kviza' },
      { status: 500 }
    );
  }
}

// Delete quiz
export async function DELETE(
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

    // Verify quiz exists and user is the instructor
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
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
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Kviz nije pronađen' },
        { status: 404 }
      );
    }

    if (quiz.lesson.module.course.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nemate dozvolu za ovu akciju' },
        { status: 403 }
      );
    }

    // Delete quiz (cascade will delete questions and options)
    await prisma.quiz.delete({
      where: { id: quizId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju kviza' },
      { status: 500 }
    );
  }
}
