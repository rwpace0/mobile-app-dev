import express from "express";
import {
  getActivePlan,
  createPlan,
  updatePlan,
  updatePlanSchedule,
  deletePlan,
} from "../controller/plansController.js";

const router = express.Router();

router.get("/active", getActivePlan);
router.post("/", createPlan);
router.put("/:planId", updatePlan);
router.put("/:planId/schedule", updatePlanSchedule);
router.delete("/:planId", deletePlan);

export default router;
