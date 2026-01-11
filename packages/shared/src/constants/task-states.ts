import { TaskStatus } from "../types/task.types";

// Task state machine: defines allowed status transitions
export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.BACKLOG]: [TaskStatus.IN_PROGRESS],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.REVIEW],
  [TaskStatus.REVIEW]: [TaskStatus.DONE],
  [TaskStatus.DONE]: [], // Terminal state - no transitions allowed
};

export const isValidTransition = (
  currentStatus: TaskStatus,
  newStatus: TaskStatus
): boolean => {
  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
};

export const getNextAllowedStatuses = (
  currentStatus: TaskStatus
): TaskStatus[] => {
  return VALID_TRANSITIONS[currentStatus];
};
