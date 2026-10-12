import { z } from "zod";

const registrationSchema = z.object({
  fullName: z.string().min(2, "user name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const verificationSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().min(4, "OTP must be at least 4 characters long"),
});

export const userValidation = {
  registrationSchema,
  verificationSchema,
};
