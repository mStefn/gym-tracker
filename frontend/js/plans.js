import { state, API_URL, authFetch } from './state.js';
import { renderPlanEditor } from './editor.js';

export async function renderPlans() {
    const container = document.getElementById("exercises");
    
    container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h2 style="margin-bottom: 5px;">Your Workouts</h2>
            <p style="color: #8e8e93; margin-top: 0;">Select a plan to start training.</p>
        </div>
        
        <div id="plans-list"></div>
        
        <button id="add-plan-btn" style="width: 100%; background: transparent; color: var(--primary); border: 2px dashed var(--primary); padding: 15px; border-radius: 14px; margin-top: 20px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s;">
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
                wrapper.style = "display: flex; gap: 8px; margin-bottom: 12px;";

                const startBtn = document.createElement("button");
                startBtn.className = "save-btn";
                startBtn.style = "margin: 0; flex: 1; text-align: left; padding-left: 20px; background: var(--card-bg); color: var(--text); border: 1px solid var(--border); font-weight: 600; font-size: 16px; cursor: pointer;";
                startBtn.innerText = plan.name;
                startBtn.onclick = () => window.renderWorkout(plan.id, plan.name);

                // NOWY PRZYCISK EDIT
                const editBtn = document.createElement("button");
                editBtn.innerText = "Edit";
                editBtn.style = "background: rgba(0, 210, 255, 0.1); border: 1px solid var(--primary); border-radius: 12px; padding: 0 15px; cursor: pointer; color: var(--primary); font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; transition: 0.2s;";
                editBtn.onclick = () => renderPlanEditor(plan.id, plan.name);

                const deleteBtn = document.createElement("button");
                deleteBtn.innerText = "Delete";
                deleteBtn.style = "background: transparent; border: 1px solid var(--danger); border-radius: 12px; padding: 0 15px; cursor: pointer; color: var(--danger); font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; transition: 0.2s;";
                deleteBtn.onclick = async () => {
                    if (confirm(`Delete plan "${plan.name}"?`)) {
                        const delRes = await authFetch(`${API_URL}/plan/${plan.id}`, { method: "DELETE" });
                        if (delRes.ok) {
                            window.navigate('workout'); 
                        } else {
                            alert("Error deleting plan");
                        }
                    }
                };

                wrapper.appendChild(startBtn);
                wrapper.appendChild(editBtn);
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
    if (addBtn) addBtn.onclick = () => renderPlanEditor();
}