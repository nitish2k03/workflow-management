import mongoose, { Schema, Document, Types } from "mongoose";
import { TaskStatus, TaskPriority } from "@workflow/shared";

export { TaskStatus, TaskPriority };

export interface ITaskDocument extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: Types.ObjectId;
  projectId: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITaskDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.BACKLOG,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for common queries
taskSchema.index({ projectId: 1, status: 1 }); // Kanban board
taskSchema.index({ projectId: 1, createdAt: -1 }); // Task listing
taskSchema.index({ assignee: 1, status: 1 }); // User's tasks

export const Task = mongoose.model<ITaskDocument>("Task", taskSchema);
