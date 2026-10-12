import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.services";

const createUser = catchAsync(async (req, res) => {
  const result = await userService.createUserIntoDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Check your mailbox for verification process...",
    data: result,
  });
});

const signupVerification = catchAsync(async (req, res) => {
  const accessToken = await userService.signupVerification(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User signup verification successfully",
    data: accessToken,
  });
});

const getUsers = catchAsync(async (req, res) => {
  const users = await userService.getUsersIntoDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "users retrived successfully",
    data: users,
  });
});

const getSingleUser = catchAsync(async (req, res) => {
  const user = await userService.getSingleUserIntoDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "user retrived successfully",
    data: user,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const updatedUser = await userService.updateUserIntoDB(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "user updated successfully",
    data: updatedUser,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const userId = req.params.id;
  await userService.deleteUserIntoDB(userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User deleted successfully",
  });
});

const newClients = catchAsync(async (req, res) => {
  const { filter } = req.query as any;
  const results = await userService.newClients(filter);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: `New clients ${filter} retrived successfully`,
    data: results,
  });
});

export const userControllers = {
  createUser,
  signupVerification,
  getUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  newClients,
};
