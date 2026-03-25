import { state, API_URL, authFetch } from './state.js';
import { renderPlanEditor } from './editor.js';

export async function renderPlans() {
    const container = document.getElementById("exercises");
    
    container.innerHTML = `
        <div class="plans-view-wrapper">
            <div class="view-header">
                <h2 class="view-title">Your Workouts</h2>
                <p class="view-subtitle">Select a plan to start training.</p>
            </div>
            
            <div id="plans-list" class="plans-container">
                <div class="spinner" style="margin: 40px auto;"></div>
            </div>
            
            <button id="add-plan-btn" class="btn-outline-primary">
                + Create New Training Plan
            </button>
        </div>
    `;
    
    try {
        const res = await authFetch(`${API_URL}/plans/${state.currentUserId}`);
        const plans = await res.json();
        const list = document.getElementById("plans-list");
        
        if (plans && plans.length > 0) {
            list.innerHTML = ""; 
            
            plans.forEach(plan => {
                const wrapper = document.createElement("div");
                wrapper.className = "plan-row-wrapper";

                const startBtn = document.createElement("button");
                startBtn.className = "plan-card-main";
                startBtn.innerText = plan.name;
                startBtn.onclick = () => window.renderWorkout(plan.id, plan.name);

                const editBtn = document.createElement("button");
                editBtn.className = "btn-icon-secondary";
                editBtn.innerText = "Edit";
                editBtn.onclick = () => renderPlanEditor(plan.id, plan.name);

                const deleteBtn = document.createElement("button");
                deleteBtn.className = "btn-icon-danger";
                deleteBtn.innerText = "Delete";
                deleteBtn.onclick = async () => {
                    if (confirm(`Are you sure you want to delete "${plan.name}"?`)) {
                        const delRes = await authFetch(`${API_URL}/plan/${plan.id}`, { method: "DELETE" });
                        if (delRes.ok) {
                            window.navigate('workout'); 
                        } else {
                            alert("Failed to delete the plan.");
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
                <div class="empty-state-card">
                    <div class="empty-state-icon">📋</div>
                    <p class="empty-state-text">No workout plans found. Time to create your first routine!</p>
                </div>
            `;
        }
    } catch (e) {
        document.getElementById("plans-list").innerHTML = `<p class="error-text" style="text-align:center;">Connection failed. Is the backend online?</p>`;
    }

    const addBtn = document.getElementById("add-plan-btn");
    if (addBtn) addBtn.onclick = () => renderPlanEditor();
}