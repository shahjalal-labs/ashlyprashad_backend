import express from "express";
import { planControllers } from "./plan.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post("/create", auth(), planControllers.createPlan);
router.get("/", planControllers.getAllPlans);
router.get("/:id", planControllers.getPlanById);
router.patch("/:id", planControllers.updatePlan);
router.delete("/:id", planControllers.deletePlan);

export const planRoutes = router;
