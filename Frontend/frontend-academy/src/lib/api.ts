import type { AcademyProgress } from '../types';

export interface AccountUser { id: string; username: string; name: string }
export interface Session { user: AccountUser | null; progress?: AcademyProgress; revision?: number }
export interface AccountSession { user: AccountUser; progress: AcademyProgress; revision: number }
export interface ServerProgress { progress: AcademyProgress; revision: number }
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'ApiError'; }
}
async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method, credentials: 'same-origin', cache: 'no-store',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch { throw new ApiError(0, 'Нет связи с сервером. Ваши изменения сохраняются на этом устройстве; повторите синхронизацию позже.'); }
  let result: unknown;
  try { result = await response.json(); }
  catch { throw new ApiError(response.status, 'Сервер аккаунтов недоступен. Проверьте запуск сервера курса.'); }
  if (!response.ok) {
    const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string' ? result.error : 'Не удалось выполнить запрос.';
    throw new ApiError(response.status, message);
  }
  return result as T;
}
export const getSession = () => request<Session>('/auth/me');
export const register = (fields: { username: string; name: string; password: string; progress?: AcademyProgress }) => request<AccountSession>('/auth/register', 'POST', fields);
export const login = (fields: { username: string; password: string }) => request<AccountSession>('/auth/login', 'POST', fields);
export const logout = () => request<{ ok: true }>('/auth/logout', 'POST');
export const getProgress = () => request<ServerProgress>('/progress');
export const saveProgress = (progress: AcademyProgress, revision: number) => request<ServerProgress>('/progress', 'PUT', { progress, revision });
