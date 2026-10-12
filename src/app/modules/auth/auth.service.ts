import prisma from "../../../shared/prisma";
import bcrypt from "bcryptjs";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import { User } from "@prisma/client";
import generateOTP from "../../../helpers/generateOtp";
import sendEmail from "../../../helpers/sendEmail";
import { uploadInSpace } from "../../../helpers/uploadInSpace";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  addDays,
  max,
  min,
  format,
} from "date-fns";
import { sendNotification } from "../notification/notification.service";

const generateRandomPassword = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const loginUserIntoDB = async (payload: User) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.status === "Deleted") {
    throw new ApiError(403, "Your account was deleted");
  }

  if (user.status === "Blocked") {
    throw new ApiError(403, "Your account was Blocked");
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password,
    user?.password
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  const isSetup =
    user?.readLevel !== null &&
    user?.age !== null &&
    user.goals &&
    user.readTiming !== null &&
    user.readDuration !== null;

  if (payload.fcmToken !== undefined) {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        fcmToken: payload.fcmToken,
      },
    });
  }

  return {
    accessToken,
    isSetup: isSetup,
  };
};

const adminLogin = async (payload: User) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
      role: "Admin",
    },
  });

  if (!user) {
    throw new ApiError(404, "Admin not found");
  }

  if (user.status === "Deleted") {
    throw new ApiError(403, "Your account was deleted");
  }

  if (user.status === "Blocked") {
    throw new ApiError(403, "Your account was Blocked");
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password,
    user?.password
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (payload.fcmToken !== undefined) {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        fcmToken: payload.fcmToken,
      },
    });
  }

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  return {
    accessToken,
  };
};

const authLogin = async (payload: User) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });
  if (user) {
    if (user.status === "Deleted") {
      throw new ApiError(403, "Your account was deleted");
    }

    if (user.status === "Blocked") {
      throw new ApiError(403, "Your account was Blocked");
    }
    const accessToken = jwtHelpers.generateToken(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.jwt_secret as string,
      config.jwt.expires_in as string
    );

    const isSetup =
      user?.readLevel !== null &&
      user?.age !== null &&
      user.goals &&
      user.readTiming !== null &&
      user.readDuration !== null;

    if (payload.fcmToken !== undefined) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          fcmToken: payload.fcmToken,
        },
      });
    }

    return {
      accessToken,
      isSetup: isSetup,
    };
  } else {
    const plainPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const user = await prisma.user.create({
      data: {
        ...payload,
        password: hashedPassword,
      },
    });

    const accessToken = jwtHelpers.generateToken(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.jwt_secret as string,
      config.jwt.expires_in as string
    );

    return {
      accessToken,
      isSetup: false,
    };
  }
};

const sendForgotPasswordOtpDB = async (email: string) => {
  const otp = generateOTP(); // 4-digit OTP
  const OTP_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minute
  const expiresAt = Date.now() + OTP_EXPIRATION_TIME;

  const existringUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!existringUser) {
    throw new ApiError(404, "User not found your provided email");
  }
  const subject = "Your Password Reset OTP";
  const html = `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2>Password Reset Request</h2>
    <p>Hi <b>${existringUser.fullName}</b>,</p>
    <p>Your OTP for password reset is:</p>
    <h1 style="color: #007BFF;">${otp}</h1>
    <p>This OTP is valid for <b>5 minutes</b>. If you did not request this, please ignore this email.</p>
    <p>Thanks, <br>The Support Team</p>
  </div>
`;
  await sendEmail(email, subject, html);
  await prisma.otp.upsert({
    where: {
      email,
    },
    update: { otpCode: otp, expiresAt: new Date(expiresAt) },
    create: { email, otpCode: otp, expiresAt: new Date(expiresAt) },
  });

  return otp;
};

const verifyForgotPasswordOtp = async (payload: {
  email: string;
  otp: string;
}) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const verifyData = await prisma.otp.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!verifyData) {
    throw new ApiError(400, "Invalid or expired OTP.");
  }

  const { otpCode: savedOtp, expiresAt } = verifyData;

  if (payload.otp !== savedOtp) {
    throw new ApiError(401, "Invalid OTP.");
  }

  if (Date.now() > expiresAt.getTime()) {
    await prisma.otp.delete({
      where: {
        email: payload.email,
      },
    }); // OTP has expired
    throw new ApiError(410, "OTP has expired. Please request a new OTP.");
  }

  // OTP is valid
  await prisma.otp.delete({
    where: {
      email: payload.email,
    },
  });

  const forgetToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  return { forgetToken };
};

const resetForgotPasswordDB = async (newPassword: string, userId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new ApiError(404, "user not found");
  }
  const email = existingUser.email as string;
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.jwt.gen_salt)
  );

  await prisma.user.update({
    where: {
      email: email,
    },
    data: {
      password: hashedPassword,
    },
  });

  await sendNotification(
    userId,
    "Password reset",
    "Your password has been reset successfully"
  );

  return;
};

const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const userInfo = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      password: true,
    },
  });
  if (!userInfo) {
    throw new ApiError(404, "User not found");
  }

  const passwordMatch = await bcrypt.compare(
    currentPassword,
    userInfo.password
  );
  if (!passwordMatch) {
    throw new ApiError(400, "Wrong current password");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.jwt.gen_salt)
  );

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });
  await sendNotification(
    userId,
    "Password change",
    "Your password has been changed successfully"
  );

  return;
};

const getProfileFromDB = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      profileImage: true,
      email: true,
      age: true,
      points: true,
      goals: true,
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  return user;
};

const updateProfileIntoDB = async (userId: string, userData: User) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "user not found for edit user");
  }
  if (userData.password) {
    const hashedPassword = await bcrypt.hash(
      userData.password,
      Number(config.jwt.gen_salt)
    );
    userData.password = hashedPassword;
  }
  await prisma.user.update({
    where: { id: userId },
    data: userData,
  });

  return;
};

const updateProfileImage = async (
  userId: string,
  file: Express.Multer.File
) => {
  if (file === undefined) {
    throw new ApiError(400, "Please select image");
  }
  const profileImage = await uploadInSpace(file, "users/photos");
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      profileImage,
    },
  });
  return;
};

const deleteMyAccount = async (userId: string) => {
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status: "Deleted",
    },
  });
  return;
};

const performance = async (userId: string) => {
  const userInfo = await prisma.user.findUnique({
    where: { id: userId },
    select: { readDuration: true },
  });

  if (!userInfo) {
    throw new ApiError(404, "User not found");
  }

  const bookComplete = await prisma.reading.count({
    where: {
      userId,
      currentPage: {
        gte: prisma.reading.fields.totalPages,
      },
    },
  });

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });

  // Get all progress for current week
  const readings = await prisma.reading.findMany({
    where: { userId },
    select: { readingTime: true, updatedAt: true },
  });

  let totalReadSeconds = 0;
  let todayReadSeconds = 0;

  // Initialize weekly progress map by day name
  const weeklyProgressByDay: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    const dayName = format(day, "EEEE"); // Sunday, Monday, ...
    weeklyProgressByDay[dayName] = 0;
  }

  readings.forEach((r) => {
    const readingSec = r.readingTime || 0;
    totalReadSeconds += readingSec;

    // Today
    if (r.updatedAt >= todayStart && r.updatedAt <= todayEnd) {
      todayReadSeconds += readingSec;
    }

    // Weekly mapping
    if (r.updatedAt >= weekStart && r.updatedAt <= weekEnd) {
      const dayName = format(startOfDay(r.updatedAt), "EEEE");
      weeklyProgressByDay[dayName] += readingSec;
    }
  });

  // Convert daily seconds to percentage of daily goal
  for (const day in weeklyProgressByDay) {
    weeklyProgressByDay[day] = userInfo.readDuration
      ? Math.min(
          100,
          Number(
            ((weeklyProgressByDay[day] / userInfo.readDuration) * 100).toFixed(
              2
            )
          )
        )
      : 0;
  }

  return {
    todayProgress: userInfo.readDuration
      ? Math.min(
          100,
          Number(((todayReadSeconds / userInfo.readDuration) * 100).toFixed(2))
        )
      : 0,
    weeklyProgressByDay,
    totalReadSeconds,
    bookComplete,
  };
};

const adminOverview = async () => {
  const totalUsers = await prisma.user.count();
  const activeUsers = await prisma.user.count({
    where: {
      status: "Active",
    },
  });

  return {
    totalUsers,
    activeUsers,
    totalEarnings: 0,
  };
};

export const authService = {
  loginUserIntoDB,
  adminLogin,
  authLogin,
  getProfileFromDB,
  updateProfileIntoDB,
  sendForgotPasswordOtpDB,
  verifyForgotPasswordOtp,
  resetForgotPasswordDB,
  changePassword,
  updateProfileImage,
  deleteMyAccount,
  performance,
  adminOverview,
};
