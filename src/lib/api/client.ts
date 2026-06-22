import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@/lib/auth/token-storage';
import { API_BASE_URL } from './endpoints';
import type { ApiErrorResponse, ApiSuccessResponse } from './types';
import { ApiError } from './types';

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

interface ValidationDetail {
  field?: string;
  message?: string;
}

const FIELD_LABELS: Record<string, string> = {
  costPrice: 'Tan narx',
  unitPrice: 'Sotuv narxi',
  quantity: 'Ombordagi miqdor',
  name: 'Nomi',
  description: 'Tavsif',
};

function formatErrorMessage(error: ApiErrorResponse): string {
  if (Array.isArray(error.details)) {
    const messages = (error.details as ValidationDetail[])
      .map((d) => {
        const label = d.field ? FIELD_LABELS[d.field] ?? d.field : '';
        const text = d.message ?? '';
        if (label && text) {
          return `${label}: ${text}`;
        }
        return text;
      })
      .filter(Boolean);
    if (messages.length > 0) {
      return messages.join('. ');
    }
  }
  return error.message ?? 'So\'rov bajarilmadi';
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const json = (await response.json()) as ApiSuccessResponse<{
    accessToken: string;
    refreshToken: string;
  }>;

  setTokens(json.data.accessToken, json.data.refreshToken);
  return json.data.accessToken;
}

async function getValidToken(): Promise<string | null> {
  const token = getAccessToken();
  if (token) return token;

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiSuccessResponse<T>> {
  const { skipAuth, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has('Content-Type') && rest.body) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const token = await getValidToken();
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
  });

  if (response.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      requestHeaders.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...rest,
        headers: requestHeaders,
      });
    }
  }

  const json = await response.json();

  if (!response.ok || json.success === false) {
    const error = json as ApiErrorResponse;
    throw new ApiError(formatErrorMessage(error), response.status);
  }

  return json as ApiSuccessResponse<T>;
}

export async function apiGet<T>(path: string, options?: RequestOptions): Promise<ApiSuccessResponse<T>> {
  return apiRequest<T>(path, options);
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<ApiSuccessResponse<T>> {
  return apiRequest<T>(path, {
    ...options,
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<ApiSuccessResponse<T>> {
  return apiRequest<T>(path, {
    ...options,
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T>(path: string, options?: RequestOptions): Promise<ApiSuccessResponse<T>> {
  return apiRequest<T>(path, { ...options, method: 'DELETE' });
}
