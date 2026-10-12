import ApiError from "../../../errors/ApiErrors";
import admin from "../../../helpers/firebaseAdmin";
import prisma from "../../../shared/prisma";
import { webpush } from "../../../helpers/pushService";
import { pushNotification } from "../../../helpers/notificationStream";
import { Response } from "express";
import { Event } from "../../../shared/event_emitter";
import axios from "axios";

export const sendNotification = async (
  receiverId: string,
  title: string,
  body: string,
  isAdmin?: boolean
) => {
  const userInfo = await prisma.user.findUnique({
    where: {
      id: receiverId,
    },
  });

  await prisma.notification.create({
    data: {
      receiverId,
      title,
      body,
      isAdmin,
    },
  });

  if (userInfo?.fcmToken) {
    const message = {
      notification: { title, body },
      token: userInfo.fcmToken,
    };

    await admin.messaging().send(message);
  }

  return;
};

let clients: Response[] = [];

export const notificationService = {
  // Register a new SSE client
  registerClient: (res: Response) => {
    clients.push(res);

    // Heartbeat to keep connection alive
    const interval = setInterval(() => {
      res.write(":\n\n"); // comment line
    }, 20000);

    // Remove client on disconnect
    res.on("close", () => {
      clearInterval(interval);
      clients = clients.filter((c) => c !== res);
    });
  },

  // Broadcast a notification to all connected clients
  broadcastNotification: (notification: any) => {
    clients.forEach((res) => {
      res.write(`data: ${JSON.stringify(notification)}\n\n`);
    });
  },
};

const myNotifications = async (userId: string) => {
  const notifications = await prisma.notification.findMany({
    where: {
      receiverId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return notifications;
};

const adminNotifications = async () => {
  const notifications = await prisma.notification.findMany({
    where: { isAdmin: true },
    orderBy: {
      createdAt: "desc",
    },
  });
  return notifications;
};

const getNotificationById = async (id: string) => {
  await prisma.notification.findUnique({ where: { id } });
  const data = await prisma.notification.update({
    where: {
      id,
    },
    data: {
      isRead: true,
    },
  });
  return data;
};

const deleteNotification = async (id: string) => {
  await prisma.notification.delete({ where: { id } });
  return;
};

const subscribe = async (userId: string, payload: any) => {
  const userInfo = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      email: true,
    },
  });
  if (!userInfo) {
    throw new ApiError(404, "User not found");
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: payload.endpoint },
    update: {
      auth: payload.keys.auth,
      p256dh: payload.keys.p256dh,
      userId: userId,
    },
    create: {
      endpoint: payload.endpoint,
      auth: payload.keys.auth,
      p256dh: payload.keys.p256dh,
      userId: userId,
    },
  });

  return;
};

const sendNotify = async (userId: string, payload: any) => {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  for (const sub of subscriptions) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: {
        auth: sub.auth,
        p256dh: sub.p256dh,
      },
    };

    try {
      await webpush.sendNotification(pushSub, JSON.stringify(payload));
    } catch (err: any) {
      console.error("Push failed", err);

      if (err.statusCode === 410 || err.statusCode === 404) {
        // remove expired subscription
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
  }
};

export const oneSignalNotify = async (
  receiverId: string,
  body: string,
  title: string,
  isAdmin?: boolean
) => {
  const ONE_SIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID || "your-onesignal-app-id";
  const ONE_SIGNAL_API_KEY = process.env.ONE_SIGNAL_API_KEY || "your-onesignal-api-key";

  const user = await prisma.user.findUnique({
    where: { id: receiverId },
  });

  // const formattedAdditionData = Object.entries(additionData || {}).reduce(
  //   (acc: any, [key, value]) => {
  //     acc[key] = String(value);
  //     return acc;
  //   },
  //   {}
  // );

  await prisma.notification.create({
    data: {
      receiverId,
      title,
      body,
      isAdmin,
    },
  });

  Event.emit("notifications", receiverId);
  Event.emit("get-notifications", receiverId);

  if (user?.fcmToken) {
    await axios.post(
      "https://onesignal.com/api/v1/notifications",
      {
        app_id: ONE_SIGNAL_APP_ID,
        target_channel: "push",
        include_subscription_ids: [user.fcmToken],
        headings: { en: title },
        contents: { en: body },
        // data: formattedAdditionData,
      },
      {
        headers: {
          Authorization: `Basic ${ONE_SIGNAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
  }

  return;
};

export const notificationServices = {
  myNotifications,
  adminNotifications,
  getNotificationById,
  deleteNotification,
  subscribe,
  sendNotify,
};
