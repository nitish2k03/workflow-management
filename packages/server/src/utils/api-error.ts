export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}
