import express from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoute } from "../modules/auth/auth.routes";
import { bookRoutes } from "../modules/book/book.routes";
import { quizzRoutes } from "../modules/quizz/quizz.routes";
import { planRoutes } from "../modules/plan/plan.routes";
import { notificationRoutes } from "../modules/notification/notification.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/books",
    route: bookRoutes,
  },
  {
    path: "/quizz",
    route: quizzRoutes,
  },
  {
    path: "/plans",
    route: planRoutes,
  },
  {
    path: "/notifications",
    route: notificationRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
