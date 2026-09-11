const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://101.37.70.188:8000";

interface ApiErrorPayload {
  detail?: string;
  message?: string;
}

export interface RequestOptions extends Omit<RequestInit, "body" | "headers"> {
  auth?: boolean;
  body?: unknown;
  headers?: HeadersInit;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
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
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | null;
    throw new ApiError(
      errorPayload?.message ??
        (typeof errorPayload?.detail === "string"
          ? errorPayload.detail
          : "请求失败，请稍后重试"),
      response.status,
    );
  }

  return payload as T;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return "请求失败，请稍后重试";
}
