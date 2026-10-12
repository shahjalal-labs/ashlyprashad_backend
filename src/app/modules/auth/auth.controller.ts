import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { authService } from "./auth.service";
import sendResponse from "../../../shared/sendResponse";

const loginUser = catchAsync(async (req, res) => {
  const result = await authService.loginUserIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User successfully logged in",
    data: result,
  });
});

const adminLogin = catchAsync(async (req, res) => {
  const result = await authService.adminLogin(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin successfully logged in",
    data: result,
  });
});

const authLogin = catchAsync(async (req, res) => {
  const result = await authService.authLogin(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User successfully authenticated",
    data: result,
  });
});

const sendForgotPasswordOtp = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    const response = await authService.sendForgotPasswordOtpDB(email);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "OTP send successfully",
      data: response,
    });
  }
);

const verifyForgotPasswordOtpCode = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;
    const response = await authService.verifyForgotPasswordOtp(payload);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "OTP verified successfully.",
      data: response,
    });
  }
);

const resetPassword = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { newPassword } = req.body;
  const result = await authService.resetForgotPasswordDB(newPassword, userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password updated successfully.",
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { newPassword, currentPassword } = req.body;
  const result = await authService.changePassword(
    userId,
    currentPassword,
    newPassword
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password changed successfully.",
    data: result,
  });
});

const getProfile = catchAsync(async (req, res) => {
  const { id } = req.user;
  const user = await authService.getProfileFromDB(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User profile retrieved successfully",
    data: user,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const { id } = req.user;
  const updatedUser = await authService.updateProfileIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your profile updated successfully",
    data: updatedUser,
  });
});

const updateProfileImage = catchAsync(async (req, res) => {
  const file = req.file as Express.Multer.File;
  await authService.updateProfileImage(req.user.id, file);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile Image update successfully",
  });
});

const deleteMyAccount = catchAsync(async (req, res) => {
  await authService.deleteMyAccount(req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your account has been deleted successfully",
  });
});

const performance = catchAsync(async (req, res) => {
  const data = await authService.performance(req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your progress retrived successfully",
    data,
  });
});

const adminOverview = catchAsync(async (req, res) => {
  const data = await authService.adminOverview();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin overview retrived successfully",
    data,
  });
});

export const authController = {
  loginUser,
  adminLogin,
  authLogin,
  getProfile,
  updateProfile,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtpCode,
  resetPassword,
  changePassword,
  updateProfileImage,
  deleteMyAccount,
  performance,
  adminOverview,
};
