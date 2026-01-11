import { Router } from "express";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { authenticate } from "../middleware/auth.middleware";
import {
  requireTaskAccess,
  requireProjectAccess,
} from "../middleware/authorization.middleware";
import { activityLogService } from "../services/activity-log.service";
import { successResponse } from "../utils/api-response";

const router = Router();

router.use(authenticate);

// Get task activity
router.get(
  "/tasks/:id/activity",
  requireTaskAccess,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await activityLogService.getTaskActivity(
        req.params.id,
        page,
        limit
      );
      successResponse(res, result.logs, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }
);

// Get project activity
router.get(
  "/projects/:projectId/activity",
  requireProjectAccess,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await activityLogService.getProjectActivity(
        req.params.projectId,
        page,
        limit
      );
      successResponse(res, result.logs, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
