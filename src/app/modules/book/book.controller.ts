import { bookServices } from "./book.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";

const getBooksByAuthor = catchAsync(async (req, res) => {
  const { author } = req.query as any;
  const result = await bookServices.getBooksByAuthor(author, req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All books has been retrived successfully",
    data: result || [],
  });
});

const getBooksByTitle = catchAsync(async (req, res) => {
  const result = await bookServices.getBooksByTitle(req.query as any);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All books has been retrived successfully",
    data: result || [],
  });
});

const getBookByNid = catchAsync(async (req, res) => {
  const { nid } = req.query as any;
  const result = await bookServices.getBookByNid(nid);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Book has been retrived successfully",
    data: result,
  });
});

const startReading = catchAsync(async (req, res) => {
  const { nid } = req.params;
  const userId = req.user.id;
  await bookServices.startReading(req.body, userId, Number(nid));
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Book reading starting successfull",
  });
});

const saveBook = catchAsync(async (req, res) => {
  const { nid } = req.params;
  const userId = req.user.id;
  await bookServices.saveBook(req.body, userId, Number(nid));
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Book saved successfull",
  });
});

const savedMyBooks = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const data = await bookServices.savedMyBooks(userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Save books retrived successfull",
    data,
  });
});

const readingProgress = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await bookServices.readingProgress(userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Reading progress retrived successfull",
    data: result,
  });
});

const readingCompleted = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await bookServices.readingCompleted(userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Reading progress retrived successfull",
    data: result,
  });
});

const generateQuizz = catchAsync(async (req, res) => {
  const { url, bookId } = req.body;
  const result = await bookServices.generateQuizz(url, bookId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Quizz generate successfull",
    data: result,
  });
});

export const bookControllers = {
  getBooksByAuthor,
  getBooksByTitle,
  getBookByNid,
  startReading,
  readingProgress,
  readingCompleted,
  saveBook,
  savedMyBooks,
  generateQuizz,
};
