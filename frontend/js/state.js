export const state = {
    currentUserId: localStorage.getItem('selectedUserId'),
    currentUserName: localStorage.getItem('selectedUserName'),
    token: localStorage.getItem('authToken'),
    tempPin: "",
    mode: ""
};

export const API_URL = `http://${window.location.hostname}:5001`;

// Helper for authenticated fetch requests
export function authFetch(url, options = {}) {
    if (state.token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${state.token}`
        };
    }
    return fetch(url, options);
}

export function logout() {
    localStorage.removeItem('selectedUserId');
    localStorage.removeItem('selectedUserName');
    localStorage.removeItem('authToken');
    location.reload();
}
