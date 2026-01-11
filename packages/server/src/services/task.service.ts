import { Task } from "../models/task.model";
import { Project } from "../models/project.model";
import { ApiError } from "../utils/api-error";
import {
  TaskStatus,
  TaskPriority,
  CreateTaskInput,
  UpdateTaskInput,
  isValidTransition,
  getNextAllowedStatuses,
} from "@workflow/shared";
import mongoose from "mongoose";
import { activityLogService } from "./activity-log.service";
import { ActivityAction } from "../models/activity-log.model";
import { emitToProject } from "../websocket";

export class TaskService {
  async create(projectId: string, data: CreateTaskInput, createdBy: string) {
    // Verify assignee is project member (if provided)
    if (data.assignee) {
      const project = await Project.findById(projectId);
      const isParticipant =
        project?.owner.toString() === data.assignee ||
        project?.members.some((m) => m.toString() === data.assignee);

      if (!isParticipant) {
        throw new ApiError(
          "BAD_REQUEST",
          "Assignee must be a project participant",
          400
        );
      }
    }

    const task = await Task.create({
      ...data,
      projectId,
      createdBy,
      status: TaskStatus.BACKLOG,
    });

    const populatedTask = await task.populate([
      { path: "assignee", select: "name email" },
      { path: "createdBy", select: "name email" },
    ]);

    // Log activity
    await activityLogService.create({
      taskId: task._id.toString(),
      projectId,
      action: ActivityAction.TASK_CREATED,
      performedBy: createdBy,
      newValue: task.title,
    });

    // Emit event
    emitToProject(projectId, "task:created", { task: populatedTask });

    return populatedTask;
  }

  async findByProject(
    projectId: string,
    options: {
      status?: TaskStatus[];
      priority?: TaskPriority;
      assignee?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { status, priority, assignee, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const query: any = { projectId };

    if (status?.length) {
      query.status = { $in: status };
    }
    if (priority) {
      query.priority = priority;
    }
    if (assignee) {
      query.assignee = assignee;
    }

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate("assignee", "name email")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(query),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getKanbanBoard(projectId: string) {
    // Single aggregation query to get tasks grouped by status
    const result = await Task.aggregate([
      { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
      {
        $lookup: {
          from: "users",
          localField: "assignee",
          foreignField: "_id",
          as: "assigneeData",
          pipeline: [{ $project: { name: 1, email: 1 } }],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByData",
          pipeline: [{ $project: { name: 1, email: 1 } }],
        },
      },
      {
        $addFields: {
          assignee: { $arrayElemAt: ["$assigneeData", 0] },
          createdBy: { $arrayElemAt: ["$createdByData", 0] },
        },
      },
      { $project: { assigneeData: 0, createdByData: 0 } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$status",
          tasks: { $push: "$$ROOT" },
        },
      },
    ]);

    // Transform to status-keyed object with all statuses
    const board: Record<TaskStatus, any[]> = {
      [TaskStatus.BACKLOG]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.REVIEW]: [],
      [TaskStatus.DONE]: [],
    };

    result.forEach((group) => {
      board[group._id as TaskStatus] = group.tasks;
    });

    return board;
  }

  async findById(taskId: string) {
    const task = await Task.findById(taskId)
      .populate("assignee", "name email")
      .populate("createdBy", "name email")
      .populate("projectId", "name");

    if (!task) {
      throw new ApiError("NOT_FOUND", "Task not found", 404);
    }

    return task;
  }

  async update(taskId: string, data: UpdateTaskInput) {
    const task = await Task.findByIdAndUpdate(
      taskId,
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate("assignee", "name email")
      .populate("createdBy", "name email");

    if (!task) {
      throw new ApiError("NOT_FOUND", "Task not found", 404);
    }

    emitToProject(task.projectId.toString(), "task:updated", { task });

    return task;
  }

  async updateStatus(taskId: string, newStatus: TaskStatus, userId: string) {
    const task = await Task.findById(taskId);

    if (!task) {
      throw new ApiError("NOT_FOUND", "Task not found", 404);
    }

    const currentStatus = task.status;

    if (!isValidTransition(currentStatus as any, newStatus as any)) {
      const allowed = getNextAllowedStatuses(currentStatus as any);
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${
          allowed.length ? allowed.join(", ") : "none (terminal state)"
        }`,
        400
      );
    }

    const previousStatus = task.status;
    task.status = newStatus;
    await task.save();

    const populatedTask = await task.populate([
      { path: "assignee", select: "name email" },
      { path: "createdBy", select: "name email" },
    ]);

    // Log activity
    await activityLogService.create({
      taskId: task._id.toString(),
      projectId: task.projectId.toString(),
      action: ActivityAction.STATUS_CHANGED,
      performedBy: userId,
      previousValue: previousStatus,
      newValue: newStatus,
    });

    // Emit event
    emitToProject(task.projectId.toString(), "task:statusChanged", {
      taskId: task._id,
      previousStatus,
      newStatus,
      updatedBy: userId,
      task: populatedTask,
    });

    // Return previous status for caller convenience
    return {
      task: populatedTask,
      previousStatus,
    };
  }

  async delete(taskId: string) {
    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
      throw new ApiError("NOT_FOUND", "Task not found", 404);
    }

    emitToProject(task.projectId.toString(), "task:deleted", { taskId });

    return { message: "Task deleted successfully" };
  }
}

export const taskService = new TaskService();
