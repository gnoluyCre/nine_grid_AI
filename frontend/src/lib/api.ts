import type { BirthChartApiResponse, BirthFormValue, RegionOption } from "../types/models";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "http://127.0.0.1:8000";

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

export async function fetchRegions(): Promise<RegionOption[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/regions`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return (await response.json()) as RegionOption[];
}

export async function createBirthChart(payload: BirthFormValue): Promise<BirthChartApiResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/charts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as BirthChartApiResponse;
}
