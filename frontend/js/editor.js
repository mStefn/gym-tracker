import { state, API_URL, authFetch, exerciseSchema } from './state.js';

/**
 * Local state for the current editing session
 */
let selectedExercisesForPlan = [];
let editingPlanId = null;

/**
 * Main function to render the Plan Editor view.
 * Used for both creating new plans and updating existing ones.
 */
export async function renderPlanEditor(planId = null, planName = "") {
    const container = document.getElementById("exercises");
    selectedExercisesForPlan = []; 
    editingPlanId = planId;

    container.innerHTML = `
        <div class="view-container">
            <button onclick="window.navigate('workout')" class="back-link">← Cancel</button>
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

    // If editing, fetch current plan configuration from backend
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

    // Event Listener for the Exercise Wizard
    document.getElementById('add-ex-btn').addEventListener('click', () => {
        window.openExerciseWizard((newExercise) => {
            const isDuplicate = selectedExercisesForPlan.some(ex => ex.name === newExercise.name);
            if (isDuplicate) {
                alert("This specific exercise variation is already in your plan.");
                return;
            }

            selectedExercisesForPlan.push({
                id: newExercise.id,
                name: newExercise.name,
                category: newExercise.category,
                sets: 3 // Default starting sets
            });
            window.renderSelectedList();
        });
    });

    document.getElementById('save-plan-btn').addEventListener('click', window.saveFullPlan);
    
    window.renderSelectedList();
}

/**
 * Renders the list of exercises currently added to the plan
 */
window.renderSelectedList = () => {
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
                           onchange="window.updateSets(${index}, this.value)" class="sets-input">
                </div>
                <button type="button" onclick="window.removeExercise(${index})" class="remove-btn">&times;</button>
            </div>
        `;
        list.appendChild(div);
    });
};

window.updateSets = (index, val) => {
    selectedExercisesForPlan[index].sets = parseInt(val) || 3;
};

window.removeExercise = (indexToRemove) => {
    selectedExercisesForPlan.splice(indexToRemove, 1);
    window.renderSelectedList();
};

/**
 * Persists the entire plan to the server using a Transactional Sync
 */
window.saveFullPlan = async () => {
    const nameInput = document.getElementById("new-plan-name");
    const planName = nameInput.value.trim();
    
    if (!planName) return alert("Please enter a name for your workout plan.");
    if (selectedExercisesForPlan.length === 0) return alert("Add at least one exercise to save the plan.");

    const saveBtn = document.getElementById('save-plan-btn');
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

        window.navigate('workout');
    } catch (e) {
        console.error("Save Error:", e);
        alert("Transaction failed: " + e.message);
        saveBtn.innerText = editingPlanId ? "Update Plan" : "Save Workout Plan";
        saveBtn.disabled = false;
    }
};

/**
 * INTERACTIVE TILE-BASED WIZARD
 * Implements a step-by-step selection flow for better UX.
 */
window.openExerciseWizard = (onComplete) => {
    let wizardModal = document.getElementById('exercise-wizard');
    
    if (!wizardModal) {
        wizardModal = document.createElement('div');
        wizardModal.id = 'exercise-wizard';
        wizardModal.className = 'modal-overlay';
        
        wizardModal.innerHTML = `
            <div class="modal-content wizard-modal">
                <div class="modal-header">
                    <div class="header-left">
                        <button id="wizard-back-btn" onclick="window.wizardBack()" class="back-arrow" style="display:none;">←</button>
                        <h3 id="wizard-title" class="wizard-step-title">Select Muscle Group</h3>
                    </div>
                    <button onclick="window.wizardClose()" class="close-x">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="wizard-grid" class="tile-grid"></div>
                </div>
            </div>
        `;
        document.body.appendChild(wizardModal);
    }

    let selection = { category: null, baseExercise: null, equipment: null, angle: null, variant: null };
    const categories = [...new Set(exerciseSchema.map(e => e.category))];

    const renderView = () => {
        let title = "Select Muscle Group";
        let items = [];
        let onClick = null;
        let showBack = true;

        if (!selection.category) {
            title = "Select Muscle Group";
            items = categories;
            showBack = false;
            onClick = (val) => { selection.category = val; renderView(); };
        } 
        else if (!selection.baseExercise) {
            title = selection.category;
            items = exerciseSchema.filter(e => e.category === selection.category).map(e => e.name);
            onClick = (val) => { 
                selection.baseExercise = exerciseSchema.find(e => e.name === val); 
                renderView(); 
            };
        } 
        else {
            const ex = selection.baseExercise;
            // Check for missing options to determine the next step
            if (ex.equipment && !selection.equipment) {
                title = "Select Equipment";
                items = ex.equipment;
                onClick = (val) => { selection.equipment = val; renderView(); };
            } 
            else if (ex.angles && !selection.angle) {
                title = "Select Angle";
                items = ex.angles;
                onClick = (val) => { selection.angle = val; renderView(); };
            } 
            else if (ex.variants && !selection.variant) {
                title = "Select Variant";
                items = ex.variants;
                onClick = (val) => { selection.variant = val; renderView(); };
            } 
            else {
                // All steps completed - build the final result
                const nameParts = [selection.angle, selection.variant, selection.equipment, selection.baseExercise.name];
                const finalName = nameParts.filter(p => p && p !== "Flat" && p !== "Standard" && p !== "Bodyweight").join(" ");
                
                window.wizardClose();
                onComplete({
                    id: finalName.replace(/\s+/g, '-').toLowerCase(),
                    name: finalName,
                    category: selection.category
                });
                return;
            }
        }

        document.getElementById('wizard-title').innerText = title;
        document.getElementById('wizard-back-btn').style.display = showBack ? 'block' : 'none';
        
        document.getElementById('wizard-grid').innerHTML = items.map(item => `
            <div class="wizard-tile" onclick="window.wizardSelect('${item}')">
                ${item}
            </div>
        `).join('');
        
        window.wizardSelect = onClick;
    };

    window.wizardBack = () => {
        if (selection.variant) selection.variant = null;
        else if (selection.angle) selection.angle = null;
        else if (selection.equipment) selection.equipment = null;
        else if (selection.baseExercise) selection.baseExercise = null;
        else if (selection.category) selection.category = null;
        renderView();
    };

    window.wizardClose = () => {
        wizardModal.classList.remove('show');
        setTimeout(() => wizardModal.remove(), 300);
    };

    setTimeout(() => wizardModal.classList.add('show'), 10);
    renderView();
};