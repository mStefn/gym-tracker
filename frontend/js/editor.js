import { API_URL, authFetch } from './state.js';

/**
 * Local state for the current editing session
 */
let selectedExercisesForPlan = [];
let editingPlanId = null;

/**
 * Main function to render the Plan Editor view.
 */
export async function renderPlanEditor(planId = null, planName = "") {
    const container = document.getElementById("exercises");
    selectedExercisesForPlan = []; 
    editingPlanId = planId;

    container.innerHTML = `
        <div class="view-container">
            <button onclick="globalThis.navigate('workout')" class="back-link">← Cancel</button>
            <h2 class="view-title">${editingPlanId ? 'Edit Training Plan' : 'Create New Plan'}</h2>
            
            <div class="editor-card">
                <div class="input-group">
                    <label class="field-label">Plan Name</label>
                    <input type="text" id="new-plan-name" value="${planName}" 
                           placeholder="e.g. Push Day, Upper Body" class="main-input">
                </div>
                
                <div class="section-divider">Exercises</div>
                <div id="exercises-setup"></div>
                
                <button id="add-ex-btn" class="btn-add-exercise">
                    + Add Exercise
                </button>
                
                <div class="editor-actions">
                    <button id="save-plan-btn" class="save-btn success-bg">
                        ${editingPlanId ? 'Update Plan' : 'Save Workout Plan'}
                    </button>
                </div>
            </div>
        </div>
    `;

    // Fetch existing exercises if in edit mode
    if (editingPlanId) {
        try {
            const res = await authFetch(`${API_URL}/plan-exercises/${editingPlanId}`);
            const existing = await res.json();
            if (existing && existing.length > 0) {
                selectedExercisesForPlan = existing.map(e => ({
                    id: e.exercise_id,
                    name: e.exercise_name,
                    category: e.category,
                    sets: e.target_sets
                }));
            }
        } catch (e) {
            console.error("Editor Error: Failed to load plan exercises", e);
        }
    }

    // Event Listener: Now uses the fixed global wizard from state.js
    document.getElementById('add-ex-btn').onclick = () => {
        globalThis.openExerciseWizard((newExercise) => {
            const isDuplicate = selectedExercisesForPlan.some(ex => ex.name === newExercise.name);
            if (isDuplicate) {
                alert("This specific exercise variation is already in your plan.");
                return;
            }

            selectedExercisesForPlan.push({
                id: newExercise.id,
                name: newExercise.name,
                category: newExercise.category,
                sets: 3 
            });
            globalThis.renderSelectedList();
        });
    };

    document.getElementById('save-plan-btn').onclick = () => globalThis.saveFullPlan();
    
    globalThis.renderSelectedList();
}

/**
 * Renders the list of exercises currently added to the plan
 */
globalThis.renderSelectedList = () => {
    const list = document.getElementById("exercises-setup");
    list.innerHTML = "";
    
    if (selectedExercisesForPlan.length === 0) {
        list.innerHTML = `<p class="empty-list-text">No exercises added to this plan yet.</p>`;
        return;
    }

    selectedExercisesForPlan.forEach((ex, index) => {
        const div = document.createElement("div");
        div.className = "selected-ex-row";
        div.innerHTML = `
            <div class="ex-info">
                <div class="ex-name">${ex.name}</div>
                <div class="ex-cat-badge">${ex.category}</div>
            </div>
            <div class="ex-controls">
                <div class="input-stack">
                    <label>Sets</label>
                    <input type="number" value="${ex.sets}" min="1" max="15" 
                           onchange="globalThis.updateSets(${index}, this.value)" class="sets-input">
                </div>
                <button type="button" onclick="globalThis.removeExercise(${index})" class="remove-btn">&times;</button>
            </div>
        `;
        list.appendChild(div);
    });
};

globalThis.updateSets = (index, val) => {
    selectedExercisesForPlan[index].sets = Number.parseInt(val, 10) || 3;
};

globalThis.removeExercise = (indexToRemove) => {
    selectedExercisesForPlan.splice(indexToRemove, 1);
    globalThis.renderSelectedList();
};

/**
 * Persists the entire plan to the server
 */
globalThis.saveFullPlan = async () => {
    const nameInput = document.getElementById("new-plan-name");
    const planName = nameInput.value.trim();
    
    if (!planName) return alert("Please enter a name for your workout plan.");
    if (selectedExercisesForPlan.length === 0) return alert("Add at least one exercise to save the plan.");

    const saveBtn = document.getElementById('save-plan-btn');
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "Synchronizing...";
    saveBtn.disabled = true;

    try {
        let finalPlanId = editingPlanId;

        // Step 1: Create or Update the Plan Identity
        if (!editingPlanId) {
            const res = await authFetch(`${API_URL}/plans`, {
                method: "POST", 
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({ name: planName })
            });
            const planData = await res.json();
            finalPlanId = planData.id;
        } else {
            await authFetch(`${API_URL}/plan/${finalPlanId}`, {
                method: "PUT", 
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({ name: planName })
            });
        }

        // Step 2: Atomic Sync of all exercises within the plan
        const syncPayload = {
            plan_id: finalPlanId,
            exercises: selectedExercisesForPlan.map(ex => ({
                name: ex.name,
                category: ex.category,
                sets: ex.sets
            }))
        };

        const syncRes = await authFetch(`${API_URL}/plan-exercises/sync`, {
            method: "POST", 
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(syncPayload)
        });

        if (!syncRes.ok) throw new Error("Server synchronization failed.");

        globalThis.navigate('workout');
    } catch (e) {
        console.error("Save Error:", e);
        alert("Transaction failed: " + e.message);
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
    }
};