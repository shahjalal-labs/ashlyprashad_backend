import { Question, Quizz } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { sendNotification } from "../notification/notification.service";
import ApiError from "../../../errors/ApiErrors";
import { paginationHelper } from "../../../shared/pagination";

const createQuizz = async (
  data: Quizz,
  questions: Question[],
  userId: string
) => {
  const existing = await prisma.question.findMany({
    where: {
      quizz: { bookId: data.bookId },
      OR: questions.map((q) => ({
        OR: [{ questionNo: q.questionNo }, { content: q.content }],
      })),
    },
    select: { questionNo: true, content: true },
  });

  if (existing.length > 0) {
    throw new Error(
      `Duplicate questions found: ${existing
        .map((e) => `No: ${e.questionNo}, Content: ${e.content}`)
        .join("; ")}`
    );
  }

  await prisma.quizz.upsert({
    where: {
      bookId: data.bookId,
    },
    update: {
      question: {
        create: questions.map((q) => ({
          content: q.content,
          questionNo: q.questionNo,
          options: q.options,
          correctAnswers: q.correctAnswers,
        })),
      },
    },
    create: {
      ...data,
      bookId: data.bookId,
      bookName: data.bookName,
      question: {
        create: questions.map((q) => ({
          content: q.content,
          questionNo: q.questionNo,
          options: q.options,
          correctAnswers: q.correctAnswers,
        })),
      },
    },
  });
  await sendNotification(
    userId,
    "New quizz created",
    `quizz added under the book:${data.bookName}`,
    true
  );
  return;
};

const getAllQuizzs = async (query: any) => {
  const { page, limit, skip } = paginationHelper(query);
  const results = await prisma.quizz.findMany({
    take: limit,
    skip: skip,
    include: {
      question: {
        select: {
          _count: {
            select: {
              participateAnswer: true,
            },
          },
        },
      },
      _count: {
        select: {
          question: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalCount = await prisma.quizz.count();

  const quizzes = results.map(({ question, ...quiz }) => {
    const participateCount = question.reduce(
      (sum, q) => sum + q._count.participateAnswer,
      0
    );

    return {
      ...quiz,
      participateCount,
    };
  });

  return {
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    quizzes,
  };
};

const getQuizzById = async (id: string) => {
  const result = await prisma.quizz.findUnique({ where: { id } });
  return result;
};

const deleteQuizz = async (id: string) => {
  await prisma.quizz.delete({ where: { id } });
  return;
};

const getQuestions = async (bookId: number) => {
  const questions = await prisma.quizz.findUnique({
    where: {
      bookId,
    },
    select: {
      id: true,
      bookName: true,
      question: {
        select: {
          id: true,
          quizzId: true,
          questionNo: true,
          content: true,
          options: true,
        },
      },
    },
  });
  return questions !== null ? questions : [];
};

const submitQuiz = async (
  userId: string,
  quizzId: string,
  answers: { questionId: string; selectedAnswers: string[] }[]
) => {
  console.log(userId);
  console.log(quizzId);
  const quizz = await prisma.quizz.findUnique({
    where: {
      id: quizzId,
    },
  });
  if (!quizz) {
    throw new ApiError(404, "Quizz not found");
  }

  let participate = await prisma.participate.findUnique({
    where: { userId_quizzId: { userId, quizzId } },
  });

  if (!participate) {
    participate = await prisma.participate.create({
      data: { userId, quizzId },
    });
  } else if (participate.isComplete) {
    throw new Error("Quiz already completed by this user.");
  }

  await prisma.participateAnswer.createMany({
    data: answers.map((a) => ({
      participateId: participate!.id,
      questionId: a.questionId,
      selectedAnswers: a.selectedAnswers,
    })),
  });

  const questions = await prisma.question.findMany({
    where: { quizzId },
    select: { id: true, correctAnswers: true },
  });

  const POINTS_PER_QUESTION = 10;
  let correctCount = 0;
  let totalPoints = 0;
  const totalQuestions = questions.length;

  answers.forEach((a) => {
    const question = questions.find((q) => q.id === a.questionId);
    if (question) {
      const isCorrect =
        a.selectedAnswers.sort().join(",") ===
        question.correctAnswers.sort().join(",");
      if (isCorrect) {
        correctCount += 1;
        totalPoints += POINTS_PER_QUESTION;
      }
    }
  });

  await prisma.participate.update({
    where: { id: participate.id },
    data: { score: totalPoints, isComplete: true },
  });

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      points: {
        increment: totalPoints,
      },
    },
  });

  await sendNotification(
    userId,
    "Quizz submited success",
    `Your correct answers count ${correctCount} and you have earn ${totalPoints} points for this ${quizz.bookName}`
  );

  return {
    correctAnswers: correctCount,
    totalQuestions,
    points: totalPoints,
    percentage: (totalPoints / (totalQuestions * POINTS_PER_QUESTION)) * 100,
  };
};

export const quizzServices = {
  createQuizz,
  getAllQuizzs,
  getQuizzById,
  deleteQuizz,
  getQuestions,
  submitQuiz,
};
