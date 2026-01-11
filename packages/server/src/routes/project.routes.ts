import { Router } from "express";
import { projectController } from "../controllers/project.controller";
import { taskController } from "../controllers/task.controller";
import { validate } from "../middleware/validation.middleware";
import { authenticate } from "../middleware/auth.middleware";
import {
  requireProjectAccess,
  requireProjectOwner,
  requireOwnerRole,
} from "../middleware/authorization.middleware";
import {
  createProjectSchema,
  updateProjectSchema,
  inviteMemberSchema,
  createTaskSchema,
} from "@workflow/shared";

const router = Router();

// Public routes (none for projects)

// Protected routes
router.use(authenticate);

router.get("/", projectController.getAll);

router.post("/", requireOwnerRole, validate(createProjectSchema), projectController.create);

router.get("/:id", requireProjectAccess, projectController.getById);

router.patch(
  "/:id",
  requireProjectAccess,
  requireProjectOwner, // Only owner can update details
  validate(updateProjectSchema),
  projectController.update
);

router.delete(
  "/:id",
  requireProjectAccess,
  requireProjectOwner,
  projectController.delete
);

router.post(
  "/:id/invite",
  requireProjectAccess,
  requireProjectOwner,
  validate(inviteMemberSchema),
  projectController.inviteMember
);

router.delete(
  "/:projectId/members/:userId",
  requireProjectAccess,
  requireProjectOwner,
  projectController.removeMember
);

// Project tasks (nested under projects)
router.get(
  "/:projectId/tasks",
  requireProjectAccess,
  taskController.getByProject
);
router.get(
  "/:projectId/tasks/board",
  requireProjectAccess,
  taskController.getKanbanBoard
);
router.post(
  "/:projectId/tasks",
  requireProjectAccess,
  validate(createTaskSchema),
  taskController.create
);

export default router;
