import { API_URL, authFetch } from './state.js';

/**
 * Initialization: Check if the user was previously logged in as admin
 */
window.onload = () => {
    const isAdmin = localStorage.getItem('adminAuth') === 'true';
    const token = localStorage.getItem('authToken');
    
    // Only attempt to show console if we have both the flag and a token
    if (isAdmin && token) {
        showConsole();
    }
};

/**
 * Admin Authentication logic
 */
window.adminLogin = async () => {
    const passwordField = document.getElementById("admin-pass");
    const pass = passwordField.value;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "admin", pin: pass })
        });

        if (res.ok) {
            const data = await res.json();
            
            // Clear any existing session data before setting new admin session
            localStorage.clear(); 
            localStorage.setItem('adminAuth', 'true');
            localStorage.setItem('adminId', data.id);
            localStorage.setItem('authToken', data.token);
            
            showConsole();
        } else {
            const errData = await res.json();
            alert("Login failed: " + (errData.error || "Invalid credentials"));
        }
    } catch (e) {
        console.error("Auth Error:", e);
        alert("Server connection error. Please check if the backend is running.");
    }
};

/**
 * UI State Management: Switch from login view to dashboard
 */
function showConsole() {
    const loginZone = document.getElementById("login-zone");
    const consoleZone = document.getElementById("console-zone");
    
    if (loginZone) loginZone.style.display = "none";
    if (consoleZone) consoleZone.style.display = "block";
    
    loadUsers();
}

window.adminLogout = () => {
    localStorage.clear();
    location.reload();
};

/**
 * User Management: Fetch all registered users (Admin only)
 */
async function loadUsers() {
    try {
        const res = await authFetch(`${API_URL}/admin/users`);
        
        if (res.status === 401) {
            // Silently return instead of aggressive alerts during login/refresh
            console.warn("Session unauthorized or expired");
            return; 
        }

        const users = await res.json();
        if (!Array.isArray(users)) return;

        const list = document.getElementById("user-list");
        if (!list) return;

        list.innerHTML = users.map(u => `
            <div class="admin-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>${u.name} ${u.is_admin ? '<span class="badge">Admin</span>' : ''}</strong>
                    ${!u.is_admin ? `<button onclick="deleteUser(${u.id})" class="btn-danger">Delete</button>` : ''}
                </div>
                ${!u.is_admin ? `
                <div style="margin-top:10px; display:flex; gap:10px;">
                    <input type="text" id="res-${u.id}" placeholder="New PIN" style="margin:0; flex:1;">
                    <button onclick="resetPin(${u.id})" class="btn-primary">Reset PIN</button>
                </div>` : ''}
            </div>
        `).join('');
    } catch (err) {
        console.error("Failed to load users:", err);
    }
}

/**
 * Admin Self-Management: Change current admin password
 */
window.changeAdminPassword = async () => {
    const oldP = document.getElementById("old-pass").value;
    const newP = document.getElementById("new-pass").value;
    const confP = document.getElementById("conf-pass").value;

    if (newP !== confP) return alert("New passwords do not match");

    // Note: userID is handled by the backend via the Auth token context
    const res = await authFetch(`${API_URL}/change-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_pin: oldP, new_pin: newP })
    });

    if (res.ok) {
        alert("Password updated successfully. Please log in again.");
        window.adminLogout();
    } else {
        const errData = await res.json();
        alert("Error: " + (errData.error || "Current password incorrect"));
    }
};

/**
 * User Administration: Reset a specific user's PIN
 */
window.resetPin = async (id) => {
    const pinInput = document.getElementById(`res-${id}`);
    const pin = pinInput.value;
    
    if (!pin) return alert("Please enter a new PIN");

    const res = await authFetch(`${API_URL}/admin/reset-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: id, new_pin: pin })
    });

    if (res.ok) {
        alert("User PIN updated");
        pinInput.value = "";
        loadUsers();
    } else {
        alert("Failed to reset PIN");
    }
};

/**
 * User Administration: Remove user from system
 */
window.deleteUser = async (id) => {
    if(confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
        const res = await authFetch(`${API_URL}/user/${id}`, { method: "DELETE" });
        if (res.ok) {
            loadUsers();
        } else {
            alert("Failed to delete user");
        }
    }
};