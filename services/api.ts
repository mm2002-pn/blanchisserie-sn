import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { STORAGE_KEYS, clearAuth, getItem, setItem } from './storage';

/**
 * Client HTTP central pour le mobile.
 *  - Bearer token injecté à chaque requête depuis SecureStore
 *  - 401 → tente un refresh → rejoue (1 fois max)
 *  - Si refresh échoue → flush tokens (l'app détectera la déconnexion via AuthContext)
 */

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export interface ApiErrorBody {
  error?: { code: string; message: string; details?: unknown };
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) {
    await clearAuth();
    return null;
  }
  try {
    const res = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${BASE_URL}/auth/refresh`,
      { refreshToken },
    );
    await setItem(STORAGE_KEYS.ACCESS_TOKEN, res.data.accessToken);
    await setItem(STORAGE_KEYS.REFRESH_TOKEN, res.data.refreshToken);
    return res.data.accessToken;
  } catch {
    await clearAuth();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<ApiErrorBody>) => {
    const status = err.response?.status ?? 0;
    const body = err.response?.data?.error;
    const original = err.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (status === 401 && original && !original._retry) {
      original._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }
    }

    throw new ApiError(
      status,
      body?.code ?? 'NETWORK_ERROR',
      body?.message ?? err.message ?? 'Erreur réseau',
      body?.details,
    );
  },
);
