import apiClient from "./client";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: "owner" | "member";
}

export const authApi = {
  login: (data: LoginData) => apiClient.post("/auth/login", data),

  register: (data: RegisterData) => apiClient.post("/auth/register", data),

  getMe: () => apiClient.get("/auth/me"),

  refresh: (refreshToken: string) =>
    apiClient.post("/auth/refresh", { refreshToken }),
};
