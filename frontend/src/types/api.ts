// src/types/api.ts

export interface ApiResponse<T = any> {
  ok: boolean;
  status?: number;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  name: string;
}

export interface Plan {
  id: string;
  name: string;
  // dodaj inne pola, jeśli backend je zwraca
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
}

export interface LogSetPayload {
  userId: string;
  planId?: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
}