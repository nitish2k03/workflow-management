import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { Project } from "../models/project.model";
import { Task } from "../models/task.model";
import { ApiError } from "../utils/api-error";
import mongoose from "mongoose";

// Verify user has "owner" role (for project creation)
export const requireOwnerRole = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "owner") {
    return next(
      new ApiError("FORBIDDEN", "Only users with owner role can create projects", 403)
    );
  }
  next();
};

// Extend AuthRequest to include project context
declare global {
  namespace Express {
    interface Request {
      project?: any;
      task?: any;
      isProjectOwner?: boolean;
    }
  }
}

// Check if user has access to project (owner or member)
export const requireProjectAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const userId = req.user?._id;

    if (!projectId || !userId) {
      throw new ApiError("BAD_REQUEST", "Project ID required", 400);
    }

    const project = await Project.findOne({
      _id: projectId,
      $or: [{ owner: userId }, { members: userId }],
    }).lean();

    if (!project) {
      throw new ApiError(
        "FORBIDDEN",
        "You do not have access to this project",
        403
      );
    }

    req.project = project;
    req.isProjectOwner = project.owner.toString() === userId;

    next();
  } catch (error) {
    next(error);
  }
};

export const requireProjectOwner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const userId = req.user?._id;

    const project = await Project.findOne({
      _id: projectId,
      owner: userId,
    }).lean();

    if (!project) {
      throw new ApiError(
        "FORBIDDEN",
        "Only project owner can perform this action",
        403
      );
    }

    req.project = project;
    req.isProjectOwner = true;

    next();
  } catch (error) {
    next(error);
  }
};

// Check task access through project membership
export const requireTaskAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const taskId = req.params.taskId || req.params.id;
    const userId = req.user?._id;

    // Aggregation to check access in single query (avoid N+1)
    const result = await Task.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(taskId) } },
      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: "$project" },
      {
        $match: {
          $or: [
            { "project.owner": new mongoose.Types.ObjectId(userId) },
            { "project.members": new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
    ]);

    if (!result.length) {
      throw new ApiError(
        "FORBIDDEN",
        "You do not have access to this task",
        403
      );
    }

    req.task = result[0];
    req.project = result[0].project;
    req.isProjectOwner = result[0].project.owner.toString() === userId;

    next();
  } catch (error) {
    next(error);
  }
};
