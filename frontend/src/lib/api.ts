// input: fetch、环境变量、请求模型与响应模型。
// output: 前端调用后端接口的统一方法与资源地址解析。
// pos: 前端 API 访问层。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import type {
  BirthChartApiResponse,
  BirthFormValue,
  ChartRecordDetailResponse,
  ChartRecordListResponse,
  ChartRecordSearchParams,
  CurrentUser,
  LoginRequest,
  MessageResponse,
  PasswordResetConfirmRequest,
  PasswordResetSendCodeRequest,
  RegionOption,
  RegisterConfirmRequest,
  RegisterSendCodeRequest,
  UpdateProfileRequest,
} from "../types/models";

const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const API_BASE_URL = configuredApiBaseUrl || (import.meta.env.DEV ? "" : "http://127.0.0.1:8000");

interface ApiErrorResponse {
  code?: string;
  message?: string;
  details?: unknown;
}

async function parseErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as ApiErrorResponse;
    return payload.message || `请求失败 (${response.status})`;
  } catch {
    return `请求失败 (${response.status})`;
  }
}

async function requestJson<T>(input: string, init?: RequestInit, options?: { allowUnauthorized?: boolean }) {
  const response = await fetch(`${API_BASE_URL}${input}`, {
    credentials: "include",
    ...init,
  });

  if (options?.allowUnauthorized && response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  if (response.status === 204) {
    return null;
  }

  return (await response.json()) as T;
}

export function resolveAvatarUrl(avatarKey: string) {
  return `${API_BASE_URL}/assets/headImg/${avatarKey}`;
}

export async function fetchRegions(): Promise<RegionOption[]> {
  return (await requestJson<RegionOption[]>("/api/v1/regions")) as RegionOption[];
}

export async function createBirthChart(payload: BirthFormValue): Promise<BirthChartApiResponse> {
  return (await requestJson<BirthChartApiResponse>("/api/v1/charts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })) as BirthChartApiResponse;
}

export async function createChartRecord(payload: BirthFormValue): Promise<ChartRecordDetailResponse> {
  return (await requestJson<ChartRecordDetailResponse>("/api/v1/chart-records", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })) as ChartRecordDetailResponse;
}

export async function updateChartRecord(recordId: number, payload: BirthFormValue): Promise<ChartRecordDetailResponse> {
  return (await requestJson<ChartRecordDetailResponse>(`/api/v1/chart-records/${recordId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })) as ChartRecordDetailResponse;
}

export async function fetchChartRecords(
  page: number,
  pageSize: number,
  search?: ChartRecordSearchParams,
): Promise<ChartRecordListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search?.name) {
    params.set("name", search.name);
  }
  if (search?.digitString) {
    params.set("digitString", search.digitString);
  }
  return (await requestJson<ChartRecordListResponse>(`/api/v1/chart-records?${params.toString()}`)) as ChartRecordListResponse;
}

export async function fetchChartRecordDetail(recordId: number): Promise<ChartRecordDetailResponse> {
  return (await requestJson<ChartRecordDetailResponse>(`/api/v1/chart-records/${recordId}`)) as ChartRecordDetailResponse;
}

export async function deleteChartRecord(recordId: number): Promise<void> {
  await requestJson<null>(`/api/v1/chart-records/${recordId}`, {
    method: "DELETE",
  });
}

export async function sendRegisterCode(payload: RegisterSendCodeRequest): Promise<MessageResponse> {
  return (await requestJson<MessageResponse>("/api/v1/auth/register/send-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })) as MessageResponse;
}

export async function confirmRegister(payload: RegisterConfirmRequest): Promise<CurrentUser> {
  return (await requestJson<CurrentUser>("/api/v1/auth/register/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })) as CurrentUser;
}

export async function login(payload: LoginRequest): Promise<CurrentUser> {
  return (await requestJson<CurrentUser>("/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })) as CurrentUser;
}

export async function logout(): Promise<void> {
  await requestJson<null>("/api/v1/auth/logout", {
    method: "POST",
  });
}

export async function sendPasswordResetCode(payload: PasswordResetSendCodeRequest): Promise<MessageResponse> {
  return (await requestJson<MessageResponse>("/api/v1/auth/password/send-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })) as MessageResponse;
}

export async function resetPassword(payload: PasswordResetConfirmRequest): Promise<MessageResponse> {
  return (await requestJson<MessageResponse>("/api/v1/auth/password/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })) as MessageResponse;
}

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  return (await requestJson<CurrentUser>("/api/v1/auth/me", undefined, { allowUnauthorized: true })) as CurrentUser | null;
}

export async function updateCurrentUser(payload: UpdateProfileRequest): Promise<CurrentUser> {
  return (await requestJson<CurrentUser>("/api/v1/auth/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })) as CurrentUser;
}
