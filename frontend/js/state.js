export const state = {
    currentUserId: localStorage.getItem('selectedUserId'),
    currentUserName: localStorage.getItem('selectedUserName'),
    tempPin: "",
    mode: ""
};

// Automatycznie wykrywa IP serwera, na którym odpalony jest frontend
export const API_URL = `http://${window.location.hostname}:5001`;

export function logout() {
    localStorage.clear();
    location.reload();
}