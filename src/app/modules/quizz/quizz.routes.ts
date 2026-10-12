import express from "express";
import { quizzControllers } from "./quizz.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post("/create", auth(), quizzControllers.createQuizz);
router.get("/", auth(), quizzControllers.getAllQuizzs);
router.get("/:id", quizzControllers.getQuizzById);
router.delete("/:id", auth(), quizzControllers.deleteQuizz);
router.get("/questions/:bookId", auth(), quizzControllers.getQuestions);
router.post("/submit-quizz/:quizzId", auth(), quizzControllers.submitQuiz);

export const quizzRoutes = router;
