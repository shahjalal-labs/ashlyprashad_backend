import express from "express";
import { UserRole } from "@prisma/client";
import {
  notificationController,
  notificationControllers,
} from "./notification.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/my-notifications",
  auth(),
  notificationControllers.myNotifications
);
router.get(
  "/admin-notifications",
  auth(UserRole.Admin),
  notificationControllers.adminNotifications
);
router.patch("/:id", auth(), notificationControllers.getNotificationById);
router.get("/events", auth(), notificationController.adminNotifications);
router.delete("/:id", auth(), notificationControllers.deleteNotification);
router.post("/push-subscribe", auth(), notificationControllers.subscribe);
router.post("/send-push", auth(), notificationControllers.sendNotify);

export const notificationRoutes = router;
