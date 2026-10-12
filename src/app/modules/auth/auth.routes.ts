import express from "express";
import { authController } from "./auth.controller";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpers/fileUploader";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post("/login", authController.loginUser);
router.post("/admin-login", authController.adminLogin);
router.post("/auth-login", authController.authLogin);
router.get("/profile", auth(), authController.getProfile);
router.post("/send-otp", authController.sendForgotPasswordOtp);
router.post("/verify-otp", authController.verifyForgotPasswordOtpCode);
router.patch("/reset-password", auth(), authController.resetPassword);
router.patch("/change-password", auth(), authController.changePassword);
router.patch("/profile", auth(), authController.updateProfile);
router.patch(
  "/update-profile-image",
  auth(),
  fileUploader.profileImage,
  authController.updateProfileImage
);
router.delete("/delete-account", auth(), authController.deleteMyAccount);
router.get("/my-performance", auth(), authController.performance);
router.get(
  "/admin-overview",
  auth(UserRole.Admin),
  authController.adminOverview
);

export const authRoute = router;
