import { state, API_URL, authFetch } from './state.js';
import { renderPlanEditor } from './editor.js';

export async function renderDashboard() {
    const container = document.getElementById("exercises");
    
    container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h2 style="margin-bottom: 5px;">Your Workouts</h2>
            <p style="color: #8e8e93; margin-top: 0;">Select a plan to start training.</p>
        </div>
        
        <div id="plans-list"></div>
        
        <button id="add-plan-btn" class="save-btn" style="background:none; color:var(--primary); border:2px dashed var(--primary); margin-top:20px; font-size:16px;">
            + Create New Training Plan
        </button>
    `;
    
    try {
        const res = await authFetch(`${API_URL}/plans/${state.currentUserId}`);
        const plans = await res.json();
        const list = document.getElementById("plans-list");
        
        if (plans && plans.length > 0) {
            plans.forEach(plan => {
                const wrapper = document.createElement("div");
                wrapper.style = "display: flex; gap: 10px; margin-bottom: 15px;";

                const startBtn = document.createElement("button");
                startBtn.className = "save-btn";
                startBtn.style = "margin: 0; flex: 1; text-align: left; padding-left: 20px; background: var(--card-bg); color: var(--text); border: 1px solid var(--border); box-shadow: 0 2px 5px rgba(0,0,0,0.02);";
                startBtn.innerText = `▶ Start: ${plan.name}`;
                startBtn.onclick = () => window.renderWorkout(plan.id, plan.name);

                const deleteBtn = document.createElement("button");
                deleteBtn.innerHTML = "🗑️";
                deleteBtn.style = "background: #ff453a; border: none; border-radius: 12px; width: 55px; cursor: pointer; color: white; font-size: 18px; display: flex; align-items: center; justify-content: center;";
                deleteBtn.onclick = async () => {
                    if (confirm(`Delete plan "${plan.name}"?`)) {
                        const delRes = await authFetch(`${API_URL}/plan/${plan.id}`, { method: "DELETE" });
                        if (delRes.ok) {
                            window.navigate('workout'); // Odświeża układ natychmiast, bez reload() przeglądarki
                        } else {
                            alert("Error deleting plan");
                        }
                    }
                };

                wrapper.appendChild(startBtn);
                wrapper.appendChild(deleteBtn);
                list.appendChild(wrapper);
            });
        } else {
            list.innerHTML = `
                <div style="text-align:center; padding: 40px 20px; background: var(--card-bg); border-radius: 18px; border: 1px dashed var(--border);">
                    <div style="font-size: 40px; margin-bottom: 10px;">📋</div>
                    <p style="color:#8e8e93; margin:0;">No plans yet. Create your first one!</p>
                </div>
            `;
        }
    } catch (e) {
        console.error("Error loading plans:", e);
    }

    const addBtn = document.getElementById("add-plan-btn");
    if (addBtn) addBtn.onclick = renderPlanEditor;
}

window.renderSettings = () => {
    document.getElementById("exercises").innerHTML = `
        <div style="max-width: 400px; margin: 0 auto;">
            <h2 style="margin-bottom: 20px;">Settings ⚙️</h2>
            <div class="exercise-card">
                <h3 style="margin-bottom: 20px;">Change PIN</h3>
                <input type="password" id="old-pin" placeholder="Current PIN">
                <input type="password" id="new-pin" maxlength="4" placeholder="New PIN (4 digits)">
                <input type="password" id="conf-pin" maxlength="4" placeholder="Confirm New PIN">
                <button onclick="window.updatePin()" class="save-btn" style="margin-top: 10px;">Update PIN</button>
            </div>
        </div>
    `;
};

window.updatePin = async () => {
    const oldPin = document.getElementById("old-pin").value;
    const newPin = document.getElementById("new-pin").value;
    const confPin = document.getElementById("conf-pin").value;

    if (newPin !== confPin) return alert("New PINs do not match!");
    if (newPin.length !== 4) return alert("PIN must be exactly 4 digits.");
    
    try {
        const res = await authFetch(`${API_URL}/change-pin`, {
            method: "POST", 
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({user_id: parseInt(state.currentUserId), old_pin: oldPin, new_pin: newPin})
        });
        if (res.ok) {
            alert("PIN successfully updated!");
            window.navigate('settings'); // Po zmianie PIN-u zostawiamy w ustawieniach (zamiast powrotu do home)
        } else {
            alert("Error: Current PIN is incorrect.");
        }
    } catch (e) {
        alert("Server connection error.");
    }
};