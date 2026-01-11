export enum ActivityAction {
  TASK_CREATED = "TASK_CREATED",
  STATUS_CHANGED = "STATUS_CHANGED",
  TASK_UPDATED = "TASK_UPDATED",
  TASK_DELETED = "TASK_DELETED",
  TASK_ASSIGNED = "TASK_ASSIGNED",
}

export interface IActivityLog {
  _id: string;
  taskId: string;
  projectId: string;
  action: ActivityAction;
  performedBy: string;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
