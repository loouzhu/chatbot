export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://101.37.70.188:8000";

interface ApiErrorPayload {
  message: string;
  code: string | null;
  status_code: number;
}

export interface RequestOptions extends Omit<RequestInit, "body" | "headers"> {
  auth?: boolean;
  body?: unknown;
  headers?: HeadersInit;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function readApiError(response: Response): Promise<ApiError> {
  const payload: unknown = await response.json().catch(() => null);
  if (payload && typeof payload === "object") {
    const error = payload as Partial<ApiErrorPayload>;
    if (typeof error.message === "string" && error.message.trim()) {
      return new ApiError(
        error.message,
        response.status,
        typeof error.code === "string" ? error.code : null,
      );
    }
  }
  return new ApiError("请求失败，请稍后重试", response.status);
}

export async function request<T>(
  path: string,
  { auth = false, body, headers: customHeaders, ...init }: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(customHeaders);
  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = window.localStorage.getItem("token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    ...init,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw await readApiError(response);
  }

  return (await response.json().catch(() => null)) as T;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return "请求失败，请稍后重试";
}
