import { state, API_URL, authFetch } from './state.js';
import { renderPlanEditor } from './editor.js';

/**
 * Renders the list of available workout plans for the current user.
 */
export async function renderPlans() {
    const container = document.getElementById("exercises");
    
    // Initial UI layout with header and "Create New" button template
    container.innerHTML = `
        <div class="view-header">
            <h2 class="view-title">Your Workouts</h2>
            <p class="view-subtitle">Select a plan to start training.</p>
        </div>
        
        <div id="plans-list" class="plans-container">
            <div class="spinner" style="margin: 40px auto;"></div>
        </div>
        
        <button id="add-plan-btn" class="btn-outline-primary full-width">
            + Create New Training Plan
        </button>
    `;
    
    try {
        // Fetch user-specific workout plans from the Go backend
        const res = await authFetch(`${API_URL}/plans/${state.currentUserId}`);
        const plans = await res.json();
        const list = document.getElementById("plans-list");
        
        if (plans && plans.length > 0) {
            list.innerHTML = ""; // Clear the spinner
            
            plans.forEach(plan => {
                const wrapper = document.createElement("div");
                wrapper.className = "plan-row-wrapper";

                // MAIN BUTTON: Starts the workout session
                const startBtn = document.createElement("button");
                startBtn.className = "plan-card-main";
                startBtn.innerText = plan.name;
                startBtn.onclick = () => window.renderWorkout(plan.id, plan.name);

                // EDIT BUTTON: Opens the plan editor (editor.js)
                const editBtn = document.createElement("button");
                editBtn.className = "btn-icon-secondary";
                editBtn.innerText = "Edit";
                editBtn.onclick = () => renderPlanEditor(plan.id, plan.name);

                // DELETE BUTTON: Removes the plan from the database
                const deleteBtn = document.createElement("button");
                deleteBtn.className = "btn-icon-danger";
                deleteBtn.innerText = "Delete";
                deleteBtn.onclick = async () => {
                    if (confirm(`Are you sure you want to delete the plan "${plan.name}"? This will also remove associated progress goals.`)) {
                        const delRes = await authFetch(`${API_URL}/plan/${plan.id}`, { method: "DELETE" });
                        if (delRes.ok) {
                            // Refresh view after deletion
                            window.navigate('workout'); 
                        } else {
                            alert("Failed to delete the plan. Please check your connection.");
                        }
                    }
                };

                wrapper.appendChild(startBtn);
                wrapper.appendChild(editBtn);
                wrapper.appendChild(deleteBtn);
                list.appendChild(wrapper);
            });
        } else {
            // Empty State UI
            list.innerHTML = `
                <div class="empty-state-card">
                    <div class="empty-state-icon">📋</div>
                    <p class="empty-state-text">No workout plans found. Time to create your first routine!</p>
                </div>
            `;
        }
    } catch (e) {
        console.error("Critical Error: Failed to load workout plans:", e);
        document.getElementById("plans-list").innerHTML = `<p class="error-text">Connection failed. Is the backend online?</p>`;
    }

    // Set up the listener for creating a new plan
    const addBtn = document.getElementById("add-plan-btn");
    if (addBtn) addBtn.onclick = () => renderPlanEditor();
}