import { state, API_URL, authFetch } from './state.js';
import { renderPlanEditor } from './editor.js';

export async function renderDashboard() {
    const container = document.getElementById("exercises");
    container.innerHTML = `<div class="spinner" style="margin-top: 50px;"></div>`;

    try {
        // Zaciągamy z backendu statystyki ORAZ plany naraz
        const [statsRes, plansRes] = await Promise.all([
            authFetch(`${API_URL}/dashboard/${state.currentUserId}`),
            authFetch(`${API_URL}/plans/${state.currentUserId}`)
        ]);

        const stats = await statsRes.json();
        const plans = await plansRes.json();

        const latestWeight = stats.weights && stats.weights.length > 0 ? stats.weights[0] : '--';

        // Funkcja pomocnicza: generowanie Heatmapy z ostatnich 45 dni
        const buildHeatmap = (activeDates) => {
            let squares = '';
            for(let i = 44; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const isActive = activeDates.includes(dateStr);
                squares += `<div style="width: 12px; height: 12px; border-radius: 2px; background: ${isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)'};"></div>`;
            }
            return squares;
        };

        // Funkcja pomocnicza: renderowanie pasków regeneracji
        const buildReadiness = (readinessObj) => {
            return ['Chest', 'Back', 'Legs', 'Shoulders'].map(cat => {
                const val = readinessObj[cat] || 100;
                let color = 'var(--success)';
                if (val < 40) color = 'var(--danger)';
                else if (val < 80) color = 'orange';
                
                return `
                    <div style="margin-bottom: 8px;">
                        <div style="display:flex; justify-content:space-between; font-size: 11px; color:#8e8e93; margin-bottom: 3px; font-weight: 600;">
                            <span>${cat}</span><span>${val}%</span>
                        </div>
                        <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.3); border-radius: 10px; overflow: hidden;">
                            <div style="width: ${val}%; height: 100%; background: ${color}; border-radius: 10px; transition: 1s;"></div>
                        </div>
                    </div>
                `;
            }).join('');
        };

        // Funkcja pomocnicza: słupki objętości (Volume)
        const buildVolume = (volArray) => {
            if(!volArray || volArray.length === 0) return `<p style="color:#8e8e93; font-size:12px; text-align:center;">No data yet</p>`;
            const maxVol = Math.max(...volArray.map(v => v.total));
            return volArray.map(v => {
                const height = maxVol > 0 ? (v.total / maxVol) * 100 : 0;
                return `
                    <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
                        <div style="height: 60px; width: 100%; display:flex; align-items:flex-end; justify-content:center; margin-bottom: 5px;">
                            <div style="width: 20px; height: ${height}%; background: var(--primary); border-radius: 4px; opacity: ${height === 100 ? '1' : '0.6'}"></div>
                        </div>
                        <span style="font-size: 9px; color: #8e8e93;">${(v.total/1000).toFixed(1)}k</span>
                    </div>
                `;
            }).join('');
        };

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 15px; padding-bottom: 40px;">
                
                <h2 style="margin: 0 0 5px 0;">Overview</h2>

                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #8e8e93; font-size: 12px; text-transform: uppercase;">Body Weight</h4>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="font-size: 24px; font-weight: bold; color: var(--text);">${latestWeight}<span style="font-size: 14px; color: #8e8e93;"> kg</span></div>
                        <div style="display:flex; gap: 8px;">
                            <input type="number" id="weight-input" placeholder="0.0" style="width: 60px; padding: 5px; text-align: center; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                            <button onclick="window.logWeight()" style="background: rgba(0, 210, 255, 0.1); color: var(--primary); border: none; border-radius: 8px; font-weight: bold; padding: 0 12px; cursor: pointer;">Log</button>
                        </div>
                    </div>
                </div>

                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 15px;">
                    <h4 style="margin: 0 0 15px 0; color: #8e8e93; font-size: 12px; text-transform: uppercase;">Muscle Readiness</h4>
                    ${buildReadiness(stats.readiness)}
                </div>

                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #8e8e93; font-size: 12px; text-transform: uppercase;">Activity (Last 45 Days)</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;">
                        ${buildHeatmap(stats.heatmap)}
                    </div>
                </div>

                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #8e8e93; font-size: 12px; text-transform: uppercase;">Volume (Last 4 Weeks)</h4>
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%; padding-top: 10px;">
                        ${buildVolume(stats.volume)}
                    </div>
                </div>

                <hr style="border: 0; border-top: 1px dashed var(--border); margin: 20px 0;">
                
                <h3 style="margin: 0 0 15px 0;">Start Training</h3>
                <div id="plans-list"></div>
                
                <button id="add-plan-btn" style="width: 100%; background: transparent; color: var(--primary); border: 2px dashed var(--primary); padding: 15px; border-radius: 14px; margin-top: 10px; font-size: 16px; font-weight: bold; cursor: pointer;">
                    + Create New Plan
                </button>
            </div>
        `;

        // Renderowanie planów (Czysty design)
        const list = document.getElementById("plans-list");
        if (plans && plans.length > 0) {
            plans.forEach(plan => {
                const wrapper = document.createElement("div");
                wrapper.style = "display: flex; gap: 10px; margin-bottom: 10px;";

                const startBtn = document.createElement("button");
                startBtn.className = "save-btn";
                startBtn.style = "margin: 0; flex: 1; text-align: left; padding-left: 20px; background: var(--card-bg); color: var(--text); border: 1px solid var(--border); font-weight: 600; font-size: 16px;";
                startBtn.innerText = plan.name;
                startBtn.onclick = () => window.renderWorkout(plan.id, plan.name);

                const deleteBtn = document.createElement("button");
                deleteBtn.innerText = "Delete";
                deleteBtn.style = "background: transparent; border: 1px solid var(--danger); border-radius: 12px; padding: 0 15px; cursor: pointer; color: var(--danger); font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center;";
                deleteBtn.onclick = async () => {
                    if (confirm(`Delete plan "${plan.name}"?`)) {
                        await authFetch(`${API_URL}/plan/${plan.id}`, { method: "DELETE" });
                        window.navigate('workout'); 
                    }
                };

                wrapper.appendChild(startBtn);
                wrapper.appendChild(deleteBtn);
                list.appendChild(wrapper);
            });
        }

        const addBtn = document.getElementById("add-plan-btn");
        if (addBtn) addBtn.onclick = renderPlanEditor;

    } catch (e) {
        console.error("Dashboard error:", e);
        container.innerHTML = `<p style="color:var(--danger); text-align:center;">Failed to load dashboard.</p>`;
    }
}

window.logWeight = async () => {
    const w = parseFloat(document.getElementById("weight-input").value);
    if (!w || w <= 0) return alert("Enter valid weight");
    
    try {
        await authFetch(`${API_URL}/weight`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ user_id: parseInt(state.currentUserId), weight: w })
        });
        window.navigate('workout'); // Odświeża układ Home, żeby waga się wczytała
    } catch(e) {
        alert("Failed to log weight");
    }
};

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
            method: "POST", headers: {"Content-Type":"application/json"},
            body: JSON.stringify({user_id: parseInt(state.currentUserId), old_pin: oldPin, new_pin: newPin})
        });
        if (res.ok) {
            alert("PIN successfully updated!");
            window.navigate('settings');
        } else {
            alert("Error: Current PIN is incorrect.");
        }
    } catch (e) {
        alert("Server connection error.");
    }
};