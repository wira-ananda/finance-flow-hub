export interface ApiErrorPayload {
  code: string;
  details: unknown | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  error: ApiErrorPayload | null;
}

export class ApiError extends Error {
  readonly code: string;

  readonly details: unknown | null;

  readonly status: number | null;

  constructor(
    message: string,
    code = "UNKNOWN_ERROR",
    details: unknown | null = null,
    status: number | null = null,
  ) {
    super(message);

    this.name = "ApiError";

    this.code = code;

    this.details = details;

    this.status = status;
  }
}
