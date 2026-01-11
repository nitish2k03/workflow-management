import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { projectService } from "../services/project.service";
import { successResponse } from "../utils/api-response";

export class ProjectController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await projectService.create(req.body, req.user!._id);
      successResponse(res, project, 201);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.user!._id;

      const result = await projectService.findUserProjects(userId, page, limit);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await projectService.findById(id);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await projectService.update(req.params.id, req.body);
      successResponse(res, project);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Service delete method expects (projectId, userId)
      const result = await projectService.delete(req.params.id, req.user!._id);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async inviteMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await projectService.inviteMember(
        req.params.id,
        req.body.email
      );
      successResponse(res, project);
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await projectService.removeMember(
        req.params.id,
        req.params.userId
      );
      successResponse(res, project);
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();
