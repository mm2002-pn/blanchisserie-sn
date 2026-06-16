import { api } from './api';
import { STORAGE_KEYS, clearAuth, setItem } from './storage';
import type { User, UserRole } from '@/types/auth.types';

/**
 * Service Auth — appelle l'API REST.
 * Persiste tokens + user dans SecureStore via storage.ts.
 */

export type ApiRole =
  | 'admin'
  | 'manager'
  | 'supervisor'
  | 'operator'
  | 'driver'
  | 'hotel';

export interface ApiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: ApiRole;
  clientId?: string | null;
}

export interface LoginResponse {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Mappe le rôle API vers le rôle attendu par les écrans mobile :
 *   `hotel` | `driver` | `supervisor`.
 *  - admin/manager/operator → on les loggue dans l'espace `supervisor`
 *    (interface staff générique côté mobile).
 */
const ROLE_MAP: Record<ApiRole, UserRole> = {
  hotel: 'hotel',
  driver: 'driver',
  supervisor: 'supervisor',
  admin: 'supervisor',
  manager: 'supervisor',
  operator: 'supervisor',
};

export function mapApiUser(u: ApiUser): User {
  return {
    id: u.id,
    email: u.email,
    role: ROLE_MAP[u.role],
    name: `${u.firstName} ${u.lastName}`.trim(),
    clientId: u.clientId ?? null,
  };
}

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function persistSession(res: LoginResponse): Promise<User> {
  const user = mapApiUser(res.user);
  await setItem(STORAGE_KEYS.ACCESS_TOKEN, res.accessToken);
  await setItem(STORAGE_KEYS.REFRESH_TOKEN, res.refreshToken);
  await setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  return user;
}

export async function logoutRequest(refreshToken: string | null) {
  if (!refreshToken) return;
  try {
    await api.post('/auth/logout', { refreshToken });
  } catch {
    // best-effort — on flush local quoi qu'il arrive
  }
}

export async function flushSession() {
  await clearAuth();
}
