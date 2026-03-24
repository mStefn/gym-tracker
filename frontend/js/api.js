import { API_URL, authFetch, logout } from './state.js';

/**
 * Generic request helper to handle common error states (like 401 Unauthorized)
 */
async function handleResponse(res) {
    if (res.status === 401) {
        console.error("API: Unauthorized access - logging out.");
        logout(); // Auto-logout on token expiration
        return { ok: false, error: "Session expired" };
    }
    
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
}

export const API = {
    // --- PUBLIC ENDPOINTS ---

    async login(name, pin) {
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, pin })
            });
            return handleResponse(res);
        } catch (err) {
            console.error("API Network Error:", err);
            return { ok: false, error: "Network error" };
        }
    },

    async signup(name, pin) {
        try {
            const res = await fetch(`${API_URL}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, pin })
            });
            return handleResponse(res);
        } catch (err) {
            console.error("API Network Error:", err);
            return { ok: false, error: "Network error" };
        }
    },

    // --- AUTHENTICATED ENDPOINTS ---

    async fetchPlans(userId) {
        const res = await authFetch(`${API_URL}/plans/${userId}`);
        return handleResponse(res);
    },

    async deletePlan(planId) {
        const res = await authFetch(`${API_URL}/plan/${planId}`, { method: "DELETE" });
        return handleResponse(res);
    },

    async fetchPlanExercises(planId) {
        const res = await authFetch(`${API_URL}/plan-exercises/${planId}`);
        return handleResponse(res);
    },

    async fetchLastResult(userId, exId, set) {
        const res = await authFetch(`${API_URL}/last/${userId}/${exId}/${set}`);
        return handleResponse(res);
    },

    async logSet(payload) {
        const res = await authFetch(`${API_URL}/log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        return handleResponse(res);
    },

    async changePin(oldPin, newPin) {
        const res = await authFetch(`${API_URL}/change-pin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ old_pin: oldPin, new_pin: newPin })
        });
        return handleResponse(res);
    },

    async deleteAccount(userId) {
        const res = await authFetch(`${API_URL}/user/${userId}`, { method: "DELETE" });
        return handleResponse(res);
    },

    async fetchExercises() {
        const res = await authFetch(`${API_URL}/exercises`);
        return handleResponse(res);
    }
};