import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { taskService } from "../services/task.service";
import { successResponse } from "../utils/api-response";

export class TaskController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const userId = req.user!._id;
      const result = await taskService.create(projectId, req.body, userId);
      successResponse(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getByProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const result = await taskService.findByProject(projectId, req.query);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getKanbanBoard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const result = await taskService.getKanbanBoard(projectId);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await taskService.findById(id);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await taskService.update(id, req.body);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user!._id;
      const result = await taskService.updateStatus(id, status, userId);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await taskService.delete(id);
      successResponse(res, null);
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
