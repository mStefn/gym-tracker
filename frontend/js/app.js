import { API } from './api.js';

// Global State
window.state = {
    currentUserId: localStorage.getItem('selectedUserId'),
    currentUserName: localStorage.getItem('selectedUserName'),
    enteredPin: ""
};

// Entry point
window.onload = () => {
    if (!window.state.currentUserId) {
        renderProfileSelection();
    } else {
        renderDashboard(); // To rzucało błąd, bo funkcja musi być niżej
    }
};

// --- AUTH / PROFILE SELECTION ---

async function renderProfileSelection() {
    const container = document.getElementById("exercises");
    container.innerHTML = `<div id="profile-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:100px;"></div>`;
    
    try {
        const users = await API.fetchUsers();
        const grid = document.getElementById("profile-grid");

        users.forEach(user => {
            const card = document.createElement("div");
            card.className = "exercise-card";
            card.style.textAlign = "center";
            card.innerHTML = `👤<br><strong>${user.name}</strong>`;
            card.onclick = () => showPinPad(user.id, user.name, user.has_pin);
            grid.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = `<p style="color:red">API Connection Failed</p>`;
    }
}

// --- DASHBOARD ---

async function renderDashboard() {
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
            <h2>Hi, ${window.state.currentUserName}</h2>
            <button onclick="logout()" class="nav-link">Logout</button>
        </div>
        <div id="plans-list"></div>
    `;
    
    try {
        const plans = await API.fetchPlans(window.state.currentUserId);
        const list = document.getElementById("plans-list");
        plans.forEach(plan => {
            const btn = document.createElement("button");
            btn.className = "save-btn";
            btn.style.marginBottom = "10px";
            btn.innerText = `Start: ${plan.name}`;
            btn.onclick = () => console.log("Loading plan:", plan.id); // Placeholder
            list.appendChild(btn);
        });
    } catch (e) {
        console.error("Dashboard error:", e);
    }
}

// --- HELPER FUNCTIONS ---

window.logout = () => {
    localStorage.clear();
    location.reload();
};

// Potrzebujesz też tych funkcji, aby uniknąć kolejnych błędów:
function showPinPad(id, name, hasPin) { console.log("Pin pad for", name); }