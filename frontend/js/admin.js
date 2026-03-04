import { API_URL, authFetch } from './state.js';

window.onload = () => {
    const isAdmin = localStorage.getItem('adminAuth') === 'true';
    if (isAdmin) showConsole();
};

window.adminLogin = async () => {
    const pass = document.getElementById("admin-pass").value;
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({name: "admin", pin: pass})
        });

        if (res.ok) {
            const data = await res.json();
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
        alert("Server connection error");
    }
};

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

async function loadUsers() {
    const res = await authFetch(`${API_URL}/admin/users`);
    
    if (res.status === 401) {
        // Cichy powrót zamiast agresywnego alertu podczas logowania
        console.warn("Session unauthorized");
        return; 
    }

    const users = await res.json();
    if (!Array.isArray(users)) return;

    const list = document.getElementById("user-list");
    if (!list) return;

    list.innerHTML = users.map(u => `
        <div class="admin-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${u.name} ${u.is_admin ? '(Admin)' : ''}</strong>
                ${!u.is_admin ? `<button onclick="deleteUser(${u.id})" style="background:#ff453a; border:none; color:white; padding:5px 10px; border-radius:5px; cursor:pointer;">Delete</button>` : ''}
            </div>
            ${!u.is_admin ? `
            <div style="margin-top:10px; display:flex; gap:10px;">
                <input type="text" id="res-${u.id}" placeholder="New PIN" style="margin:0; flex:1;">
                <button onclick="resetPin(${u.id})" style="background:#0a84ff; border:none; color:white; padding:0 15px; border-radius:8px; cursor:pointer;">Reset</button>
            </div>` : ''}
        </div>
    `).join('');
}

window.changeAdminPassword = async () => {
    const oldP = document.getElementById("old-pass").value;
    const newP = document.getElementById("new-pass").value;
    const confP = document.getElementById("conf-pass").value;
    const adminId = localStorage.getItem('adminId');

    if (newP !== confP) return alert("Passwords do not match");

    const res = await authFetch(`${API_URL}/change-pin`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user_id: parseInt(adminId), old_pin: oldP, new_pin: newP})
    });

    if (res.ok) {
        alert("Password updated! Log in again.");
        window.adminLogout();
    } else {
        const errData = await res.json();
        alert("Error: " + (errData.error || "Incorrect current password"));
    }
};

window.resetPin = async (id) => {
    const pin = document.getElementById(`res-${id}`).value;
    await authFetch(`${API_URL}/admin/reset-pin`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user_id: id, new_pin: pin})
    });
    alert("User PIN updated");
    loadUsers();
};

window.deleteUser = async (id) => {
    if(confirm("Delete user?")) {
        await authFetch(`${API_URL}/user/${id}`, { method: "DELETE" });
        loadUsers();
    }
};