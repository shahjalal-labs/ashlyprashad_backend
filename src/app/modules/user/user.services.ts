import { User } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import bcrypt from "bcryptjs";
import prisma from "../../../shared/prisma";
import generateOTP from "../../../helpers/generateOtp";
import sendEmail from "../../../helpers/sendEmail";
import { paginationHelper } from "../../../shared/pagination";
import { searchUsers } from "../../../shared/searchUsers";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { sendNotification } from "../notification/notification.service";

//create new user
const createUserIntoDB = async (payload: User) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (existingUser) {
    throw new ApiError(409, "Email already exist!");
  }

  const hashedPassword = await bcrypt.hash(payload.password as string, 10);

  const userInfo = await prisma.pendingUser.upsert({
    where: { email: payload.email },
    update: {
      fullName: payload.fullName,
      email: payload.email,
      password: hashedPassword,
    },
    create: {
      fullName: payload.fullName,
      email: payload.email,
      password: hashedPassword,
    },
  });

  // Generate OTP and expiry time
  const otp = generateOTP(); // 4-digit OTP
  const OTP_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minute
  const expiresAt = Date.now() + OTP_EXPIRATION_TIME;
  const subject = "Signup Verification";
  const html = `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2>User Signup Verification</h2>
    <p>Hi <b>${userInfo.fullName}</b>,</p>
    <p>Your Signup Verification Code is:</p>
    <h1 style="color: #007BFF;">${otp}</h1>
    <p>This OTP is valid for <b>5 minutes</b>. If you did not request this, please ignore this email.</p>
    <p>Thanks, <br>The Support Team</p>
  </div>
`;
  await sendEmail(userInfo.email, subject, html);
  await prisma.otp.upsert({
    where: {
      email: userInfo.email,
    },
    update: { otpCode: otp, expiresAt: new Date(expiresAt) },
    create: {
      email: userInfo.email,
      otpCode: otp,
      expiresAt: new Date(expiresAt),
    },
  });

  return otp;
};
//verify user using otp for signup
const signupVerification = async (payload: {
  email: string;
  otp: string;
  fcmToken?: string;
}) => {
  const { email, otp } = payload;

  if (!email && !otp) {
    throw new ApiError(400, "Email and OTP are required.");
  }

  const existUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existUser) {
    throw new ApiError(404, "This Email Already Verified Using OTP");
  }

  const pendingUser = await prisma.pendingUser.findUnique({
    where: { email: email },
  });
  if (!pendingUser) {
    throw new ApiError(404, "Please first sign up");
  }

  const verifyData = await prisma.otp.findUnique({
    where: {
      email: email,
    },
  });

  if (!verifyData) {
    throw new ApiError(400, "Invalid or expired OTP.");
  }

  const { otpCode: savedOtp, expiresAt } = verifyData;

  if (otp !== savedOtp) {
    throw new ApiError(401, "Invalid OTP.");
  }

  if (Date.now() > expiresAt.getTime()) {
    await prisma.otp.delete({
      where: {
        email: email,
      },
    }); // OTP has expired
    throw new ApiError(410, "OTP has expired. Please request a new OTP.");
  }

  const user = await prisma.$transaction(async (tx) => {
    await tx.otp.delete({
      where: { email: email },
    });

    await tx.pendingUser.delete({
      where: { email: email },
    });

    return tx.user.create({
      data: {
        fullName: pendingUser.fullName,
        email: pendingUser.email,
        password: pendingUser.password,
      },
    });
  });
  if (!user) {
    throw new ApiError(500, "Failed to create user");
  }

  await sendNotification(
    user.id,
    "Account Create",
    "Welcome to our platform, Your account has been created successfully"
  );

  return;
};

//get single user
const getSingleUserIntoDB = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      profileImage: true,
      email: true,
      readLevel: true,
      points: true,
    },
  });
  if (!user) {
    throw new ApiError(404, "user not found!");
  }
  return user;
};

//get all users
const getUsersIntoDB = async (query: any) => {
  const { search } = query;
  const { page, limit, skip } = paginationHelper(query);
  const searchFilter = searchUsers(search);

  const users = await prisma.user.findMany({
    where: searchFilter,
    select: {
      id: true,
      fullName: true,
      profileImage: true,
      email: true,
      readLevel: true,
      points: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip,
  });

  const totalCount = await prisma.user.count({ where: searchFilter });
  const totalPages = Math.ceil(totalCount / limit);

  return {
    totalCount,
    totalPages,
    currentPage: page,
    users,
  };
};

//update user
const updateUserIntoDB = async (id: string, userData: User) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  if (!existingUser) {
    throw new ApiError(404, "user not found for edit user");
  }

  await prisma.user.update({
    where: { id },
    data: userData,
  });

  return;
};

//delete user
const deleteUserIntoDB = async (userId: string) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!existingUser) {
    throw new ApiError(404, "User not found for delete this");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: "Deleted",
    },
  });

  await sendNotification(
    userId,
    "Account Delete",
    ` ${existingUser.fullName} Account deleted successfull`,
    true
  );
  return;
};

const newClients = async (filter: "today" | "weekly" | "monthly") => {
  let startDate: Date;
  let endDate: Date;

  const now = new Date();

  if (filter === "today") {
    startDate = startOfDay(now);
    endDate = endOfDay(now);
  } else if (filter === "weekly") {
    startDate = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
    endDate = endOfWeek(now, { weekStartsOn: 0 });
  } else if (filter === "monthly") {
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
  } else {
    throw new Error("Invalid filter");
  }

  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      profileImage: true,
    },
  });

  return {
    count: users.length,
    users,
  };
};

export const userService = {
  createUserIntoDB,
  signupVerification,
  getUsersIntoDB,
  getSingleUserIntoDB,
  updateUserIntoDB,
  deleteUserIntoDB,
  newClients,
};
