const API_URL = `http://${window.location.hostname}:5001`;

export const API = {
    async fetchUsers() {
        const res = await fetch(`${API_URL}/users`);
        return res.json();
    },
    async auth(userId, pin) {
        const res = await fetch(`${API_URL}/auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, pin: pin })
        });
        return { ok: res.ok, status: res.status, data: await res.json() };
    },
    async fetchPlans(userId) {
        const res = await fetch(`${API_URL}/plans/${userId}`);
        return res.json();
    },
    async fetchPlanExercises(planId) {
        const res = await fetch(`${API_URL}/plan-exercises/${planId}`);
        return res.json();
    },
    async fetchLastResult(userId, exId, set) {
        const res = await fetch(`${API_URL}/last/${userId}/${exId}/${set}`);
        return res.json();
    },
    async logSet(payload) {
        return fetch(`${API_URL}/log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    }
};