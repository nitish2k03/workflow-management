import { ActivityLog, ActivityAction } from "../models/activity-log.model";
import mongoose from "mongoose";

interface CreateActivityDto {
  taskId: string;
  projectId: string;
  action: ActivityAction;
  performedBy: string;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}

export class ActivityLogService {
  async create(data: CreateActivityDto) {
    return ActivityLog.create(data);
  }

  async getTaskActivity(taskId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find({ taskId })
        .populate("performedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments({ taskId }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getProjectActivity(projectId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.aggregate([
        { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "performedBy",
            foreignField: "_id",
            as: "performedByData",
            pipeline: [{ $project: { name: 1, email: 1 } }],
          },
        },
        {
          $lookup: {
            from: "tasks",
            localField: "taskId",
            foreignField: "_id",
            as: "taskData",
            pipeline: [{ $project: { title: 1 } }],
          },
        },
        {
          $addFields: {
            performedBy: { $arrayElemAt: ["$performedByData", 0] },
            task: { $arrayElemAt: ["$taskData", 0] },
          },
        },
        { $project: { performedByData: 0, taskData: 0 } },
      ]),
      ActivityLog.countDocuments({ projectId }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

export const activityLogService = new ActivityLogService();
