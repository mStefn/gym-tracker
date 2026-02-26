import { API } from './api.js';

// Global State
window.state = {
    currentUserId: localStorage.getItem('selectedUserId'),
    currentUserName: localStorage.getItem('selectedUserName'),
    enteredPin: ""
};

window.onload = () => {
    if (!window.state.currentUserId) {
        renderProfileSelection();
    } else {
        renderDashboard();
    }
};

// Global functions for buttons (exposed to window for onclick)
window.logout = () => {
    localStorage.clear();
    location.reload();
};

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
            card.style.padding = "30px 10px";
            card.innerHTML = `
                <div style="font-size:40px; margin-bottom:10px;">👤</div>
                <strong>${user.name}</strong><br>
                <small style="color:#8e8e93">${user.has_pin ? 'Locked' : 'No PIN set'}</small>
            `;
            card.onclick = () => showPinPad(user.id, user.name, user.has_pin);
            grid.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = `<p style="text-align:center; color:red; margin-top:50px;">Connection Error</p>`;
    }
}

// ... logic for PinPad, Dashboard and Workout will follow this pattern ...
// (For brevity, I will combine the rest into a clean modular flow below)