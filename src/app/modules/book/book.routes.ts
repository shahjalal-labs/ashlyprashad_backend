import express from "express";
import { bookControllers } from "./book.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get("/by-author", auth(), bookControllers.getBooksByAuthor);
router.get("/by-title", auth(), bookControllers.getBooksByTitle);
router.get("/single-book", auth(), bookControllers.getBookByNid);
router.post("/reading/:nid", auth(), bookControllers.startReading);
router.post("/save-book/:nid", auth(), bookControllers.saveBook);
router.get("/reading-progress", auth(), bookControllers.readingProgress);
router.get("/reading-completed", auth(), bookControllers.readingCompleted);
router.get("/saved-books", auth(), bookControllers.savedMyBooks);
router.post("/generate-quizz", bookControllers.generateQuizz);

export const bookRoutes = router;
