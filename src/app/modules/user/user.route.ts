import express from "express";
import { userControllers } from "./user.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post("/create", userControllers.createUser);
router.post("/signup-verification", userControllers.signupVerification);
router.get("/", auth(), userControllers.getUsers);
router.get("/:id", auth(), userControllers.getSingleUser);
router.patch("/:id", auth(), userControllers.updateUser);
router.delete("/:id", auth(), userControllers.deleteUser);
router.get("/new/users", auth(UserRole.Admin), userControllers.newClients);

export const userRoutes = router;
