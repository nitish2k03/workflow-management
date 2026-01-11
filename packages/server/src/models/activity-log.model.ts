import mongoose, { Schema, Document, Types } from "mongoose";

export enum ActivityAction {
  TASK_CREATED = "TASK_CREATED",
  STATUS_CHANGED = "STATUS_CHANGED",
  TASK_UPDATED = "TASK_UPDATED",
  TASK_DELETED = "TASK_DELETED",
  TASK_ASSIGNED = "TASK_ASSIGNED",
}

export interface IActivityLogDocument extends Document {
  taskId: Types.ObjectId;
  projectId: Types.ObjectId;
  action: ActivityAction;
  performedBy: Types.ObjectId;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLogDocument>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(ActivityAction),
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    previousValue: String,
    newValue: String,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for efficient retrieval
activityLogSchema.index({ taskId: 1, createdAt: -1 });
activityLogSchema.index({ projectId: 1, createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLogDocument>(
  "ActivityLog",
  activityLogSchema
);
