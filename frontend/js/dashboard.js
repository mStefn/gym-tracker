import { state, API_URL, logout } from './state.js';

export async function renderDashboard() {
    document.getElementById("main-nav").innerHTML = "";
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
            <h2 style="margin:0">Hi, ${state.currentUserName}</h2>
            <div>
                <button onclick="renderSettings()" style="background:none; border:none; font-size:24px;">👤</button>
                <button onclick="window.appLogout()" class="nav-link" style="margin-left:10px;">Logout</button>
            </div>
        </div>
        <div id="plans-list"></div>
    `;
    const res = await fetch(`${API_URL}/plans/${state.currentUserId}`);
    const plans = await res.json();
    const list = document.getElementById("plans-list");
    plans.forEach(plan => {
        const btn = document.createElement("button");
        btn.className = "save-btn"; btn.style.marginBottom = "15px";
        btn.innerText = `Start: ${plan.name}`;
        btn.onclick = () => window.renderWorkout(plan.id, plan.name);
        list.appendChild(btn);
    });
}

window.appLogout = logout;

window.renderSettings = () => {
    document.getElementById("exercises").innerHTML = `
        <div style="padding: 20px;">
            <button onclick="location.reload()" class="nav-link">← Back</button>
            <h2>Settings</h2>
            <div class="exercise-card">
                <h3>Change PIN</h3>
                <input type="password" id="old-pin" placeholder="Current PIN">
                <input type="password" id="new-pin" maxlength="4" placeholder="New PIN">
                <input type="password" id="conf-pin" maxlength="4" placeholder="Confirm PIN">
                <button onclick="updatePin()" class="save-btn">Update PIN</button>
            </div>
        </div>
    `;
};

window.updatePin = async () => {
    const oldPin = document.getElementById("old-pin").value;
    const newPin = document.getElementById("new-pin").value;
    if (newPin !== document.getElementById("conf-pin").value) return alert("Mismatch");
    const res = await fetch(`${API_URL}/change-pin`, {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user_id: parseInt(state.currentUserId), old_pin: oldPin, new_pin: newPin})
    });
    if (res.ok) location.reload(); else alert("Error");
};