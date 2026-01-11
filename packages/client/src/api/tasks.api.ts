import apiClient from "./client";

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  assignee?: string;
}

export const tasksApi = {
  getByProject: (projectId: string, params?: Record<string, string>) =>
    apiClient.get(`/projects/${projectId}/tasks`, { params }),

  getKanbanBoard: (projectId: string) =>
    apiClient.get(`/projects/${projectId}/tasks/board`),

  getById: (id: string) => apiClient.get(`/tasks/${id}`),

  create: (projectId: string, data: CreateTaskData) =>
    apiClient.post(`/projects/${projectId}/tasks`, data),

  update: (id: string, data: Partial<CreateTaskData>) =>
    apiClient.patch(`/tasks/${id}`, data),

  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/tasks/${id}/status`, { status }),

  delete: (id: string) => apiClient.delete(`/tasks/${id}`),

  getActivity: (taskId: string, page = 1) =>
    apiClient.get(`/tasks/${taskId}/activity?page=${page}`),
};
