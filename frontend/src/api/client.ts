import { useAuthStore } from '../store/useAuthStore';

export const API_URL = "/api";

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Pobieramy aktualny stan z Zustand bez hooka (przydatne poza komponentami React)
  const { token } = useAuthStore.getState();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}