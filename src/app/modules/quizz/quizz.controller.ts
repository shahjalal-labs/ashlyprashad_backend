import { quizzServices } from "./quizz.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";

const createQuizz = catchAsync(async (req, res) => {
  const { questions, ...data } = req.body;
  await quizzServices.createQuizz(data, questions, req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The quizz has been created successfully",
  });
});

const getAllQuizzs = catchAsync(async (req, res) => {
  const result = await quizzServices.getAllQuizzs(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All quizzs has been retrived successfully",
    data: result,
  });
});

const getQuizzById = catchAsync(async (req, res) => {
  const result = await quizzServices.getQuizzById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "quizz has been retrived successfully",
    data: result,
  });
});

const deleteQuizz = catchAsync(async (req, res) => {
  await quizzServices.deleteQuizz(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "quizz has been deleted successfully",
  });
});

const getQuestions = catchAsync(async (req, res) => {
  const data = await quizzServices.getQuestions(Number(req.params.bookId));
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Questions retrived successfully",
    data,
  });
});

const submitQuiz = catchAsync(async (req, res) => {
  const data = await quizzServices.submitQuiz(
    req.user.id,
    req.params.quizzId,
    req.body.answers
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Quizz submited successfully",
    data,
  });
});

export const quizzControllers = {
  createQuizz,
  getAllQuizzs,
  getQuizzById,
  deleteQuizz,
  getQuestions,
  submitQuiz,
};
