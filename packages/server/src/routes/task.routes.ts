import { Router } from "express";
import { taskController } from "../controllers/task.controller";
import { validate } from "../middleware/validation.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { requireTaskAccess } from "../middleware/authorization.middleware";
import { updateTaskSchema, updateTaskStatusSchema } from "@workflow/shared";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Task operations (access checked via project membership)
router.get("/:id", requireTaskAccess, taskController.getById);
router.patch(
  "/:id",
  requireTaskAccess,
  validate(updateTaskSchema),
  taskController.update
);
router.patch(
  "/:id/status",
  requireTaskAccess,
  validate(updateTaskStatusSchema),
  taskController.updateStatus
);
router.delete("/:id", requireTaskAccess, taskController.delete);

export default router;
