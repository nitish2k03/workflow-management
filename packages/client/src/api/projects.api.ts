import apiClient from "./client";

export interface CreateProjectData {
  name: string;
  description?: string;
}

export const projectsApi = {
  getAll: (page = 1, limit = 10) =>
    apiClient.get(`/projects?page=${page}&limit=${limit}`),

  getById: (id: string) => apiClient.get(`/projects/${id}`),

  create: (data: CreateProjectData) => apiClient.post("/projects", data),

  update: (id: string, data: Partial<CreateProjectData>) =>
    apiClient.patch(`/projects/${id}`, data),

  delete: (id: string) => apiClient.delete(`/projects/${id}`),

  inviteMember: (projectId: string, email: string) =>
    apiClient.post(`/projects/${projectId}/invite`, { email }),

  removeMember: (projectId: string, userId: string) =>
    apiClient.delete(`/projects/${projectId}/members/${userId}`),
};
