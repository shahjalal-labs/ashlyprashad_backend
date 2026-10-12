import {
  notificationService,
  notificationServices,
} from "./notification.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";

const myNotifications = catchAsync(async (req, res) => {
  const result = await notificationServices.myNotifications(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "My notifications has been retrived successfully",
    data: result,
  });
});

export const notificationController = {
  adminNotifications: catchAsync(async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    notificationService.registerClient(res);
  }),
};

const adminNotifications = catchAsync(async (req, res) => {
  const result = await notificationServices.adminNotifications();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Admin notifications has been retrived successfully",
    data: result,
  });
});

const getNotificationById = catchAsync(async (req, res) => {
  const result = await notificationServices.getNotificationById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "notification has been retrived successfully",
    data: result,
  });
});

const deleteNotification = catchAsync(async (req, res) => {
  await notificationServices.deleteNotification(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "notification has been deleted successfully",
  });
});

const subscribe = catchAsync(async (req, res) => {
  await notificationServices.subscribe(req.user.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "push notification subscribe successfully",
  });
});

const sendNotify = catchAsync(async (req, res) => {
  await notificationServices.sendNotify(req.user.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "push notification send successfully",
  });
});

export const notificationControllers = {
  myNotifications,
  adminNotifications,
  getNotificationById,
  deleteNotification,
  subscribe,
  sendNotify,
};
