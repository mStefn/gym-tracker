import { state, API_URL, logout } from './state.js';
import { renderPlanEditor } from './editor.js';

export async function renderDashboard() {
    document.getElementById("main-nav").innerHTML = "";
    const container = document.getElementById("exercises");
    
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
            <h2 style="margin:0">Hi, ${state.currentUserName}</h2>
            <div>
                <button onclick="renderSettings()" style="background:none; border:none; font-size:24px; cursor:pointer;">👤</button>
                <button onclick="window.appLogout()" class="nav-link" style="margin-left:10px;">Logout</button>
            </div>
        </div>
        <div id="plans-list"></div>
        
        <button id="add-plan-btn" class="save-btn" style="background:none; color:var(--primary); border:2px dashed var(--primary); margin-top:20px; font-size:16px;">
            + Create New Training Plan
        </button>
    `;
    
    try {
        const res = await fetch(`${API_URL}/plans/${state.currentUserId}`);
        const plans = await res.json();
        const list = document.getElementById("plans-list");
        
        if (plans && plans.length > 0) {
            plans.forEach(plan => {
                const wrapper = document.createElement("div");
                wrapper.style = "display: flex; gap: 10px; margin-bottom: 15px;";

                const startBtn = document.createElement("button");
                startBtn.className = "save-btn";
                startBtn.style = "margin: 0; flex: 1; text-align: left; padding-left: 20px;";
                startBtn.innerText = `Start: ${plan.name}`;
                startBtn.onclick = () => window.renderWorkout(plan.id, plan.name);

                const deleteBtn = document.createElement("button");
                deleteBtn.innerHTML = "🗑️";
                deleteBtn.style = "background: #ff453a; border: none; border-radius: 12px; width: 55px; cursor: pointer; color: white; font-size: 18px; display: flex; align-items: center; justify-content: center;";
                deleteBtn.onclick = async () => {
                    if (confirm(`Delete plan "${plan.name}"?`)) {
                        const delRes = await fetch(`${API_URL}/plans/${plan.id}`, { method: "DELETE" });
                        if (delRes.ok) location.reload();
                        else alert("Error deleting plan");
                    }
                };

                wrapper.appendChild(startBtn);
                wrapper.appendChild(deleteBtn);
                list.appendChild(wrapper);
            });
        } else {
            list.innerHTML = `<p style="text-align:center; color:#8e8e93; margin:20px 0;">No plans yet. Create your first one!</p>`;
        }
    } catch (e) {
        console.error("Error loading plans:", e);
    }

    setTimeout(() => {
        const btn = document.getElementById("add-plan-btn");
        if (btn) btn.onclick = renderPlanEditor;
    }, 0);
}

window.appLogout = logout;

window.renderSettings = () => {
    document.getElementById("exercises").innerHTML = `
        <div style="padding: 20px;">
            <button onclick="location.reload()" class="nav-link">← Back</button>
            <h2 style="margin-top:20px;">Settings</h2>
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