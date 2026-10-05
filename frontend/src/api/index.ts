// src/api/index.ts
import { useAuthStore } from '../store/useAuthStore';
import type { ApiResponse, AuthResponse, Plan, Exercise, LogSetPayload } from '../types/api';

export const API_URL = "/api";

// --- BAZOWY KLIENT HTTP ---

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { token } = useAuthStore.getState();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
}

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  if (res.status === 401) {
    console.error("API: Unauthorized access - logging out.");
    useAuthStore.getState().logout(); // Wylogowuje usera i czyści stan
    return { ok: false, error: "Session expired" };
  }
  
  try {
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // Jeśli odpowiedź jest pusta (np. po DELETE)
    return { ok: res.ok, status: res.status, data: {} as T };
  }
}

// --- GŁÓWNY OBIEKT API ---

export const API = {
  // --- PUBLIC ENDPOINTS ---

  async login(name: string, pin: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pin })
      });
      return handleResponse<AuthResponse>(res);
    } catch (err) {
      console.error("API Network Error:", err);
      return { ok: false, error: "Network error" };
    }
  },

  async signup(name: string, pin: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const res = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pin })
      });
      return handleResponse<AuthResponse>(res);
    } catch (err) {
      console.error("API Network Error:", err);
      return { ok: false, error: "Network error" };
    }
  },

  // --- AUTHENTICATED ENDPOINTS ---

  async fetchPlans(userId: string): Promise<ApiResponse<Plan[]>> {
    const res = await authFetch(`${API_URL}/plans/${userId}`);
    return handleResponse<Plan[]>(res);
  },

  async deletePlan(planId: string): Promise<ApiResponse<void>> {
    const res = await authFetch(`${API_URL}/plan/${planId}`, { method: "DELETE" });
    return handleResponse<void>(res);
  },

  async fetchPlanExercises(planId: string): Promise<ApiResponse<Exercise[]>> {
    const res = await authFetch(`${API_URL}/plan-exercises/${planId}`);
    return handleResponse<Exercise[]>(res);
  },

  async fetchLastResult(userId: string, exId: string, setNumber: number): Promise<ApiResponse<any>> {
    const res = await authFetch(`${API_URL}/last/${userId}/${exId}/${setNumber}`);
    return handleResponse<any>(res);
  },

  async logSet(payload: LogSetPayload): Promise<ApiResponse<void>> {
    const res = await authFetch(`${API_URL}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return handleResponse<void>(res);
  },

  async changePin(oldPin: string, newPin: string): Promise<ApiResponse<void>> {
    const res = await authFetch(`${API_URL}/change-pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ old_pin: oldPin, new_pin: newPin })
    });
    return handleResponse<void>(res);
  },

  async deleteAccount(userId: string): Promise<ApiResponse<void>> {
    const res = await authFetch(`${API_URL}/user/${userId}`, { method: "DELETE" });
    return handleResponse<void>(res);
  },

  async fetchExercises(): Promise<ApiResponse<Exercise[]>> {
    const res = await authFetch(`${API_URL}/exercises`);
    return handleResponse<Exercise[]>(res);
  }
};