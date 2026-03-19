import { state, API_URL, authFetch } from './state.js';

const EXERCISES_DB = [
  { "name": "Bench Press", "category": "Chest", "equipment": ["Barbell", "Dumbbell", "Machine"], "angles": ["Flat", "Incline", "Decline"] },
  // DODANE KĄTY DO CHEST FLY:
  { "name": "Chest Fly", "category": "Chest", "equipment": ["Dumbbell", "Machine", "Cable"], "angles": ["Flat", "Incline", "Decline"] },
  { "name": "Push-Up", "category": "Chest", "equipment": ["Bodyweight"] },
  { "name": "Pull-Up", "category": "Back", "equipment": ["Bodyweight", "Assisted"] },
  { "name": "Row", "category": "Back", "equipment": ["Barbell", "Cable", "T-Bar", "Dumbbell", "Machine"] },
  { "name": "Lat Pulldown", "category": "Back", "equipment": ["Cable", "Machine"] },
  { "name": "Straight Arm Pulldown", "category": "Back", "equipment": ["Cable"] },
  { "name": "Squat", "category": "Legs", "equipment": ["Barbell", "Dumbbell", "Machine"] },
  { "name": "Deadlift", "category": "Legs", "equipment": ["Barbell", "Dumbbell"] },
  { "name": "Romanian Deadlift", "category": "Legs", "equipment": ["Barbell", "Dumbbell"] },
  { "name": "Leg Press", "category": "Legs", "equipment": ["Machine"] },
  { "name": "Leg Extension", "category": "Legs", "equipment": ["Machine"] },
  { "name": "Leg Curl", "category": "Legs", "equipment": ["Machine"] },
  { "name": "Hip Thrust", "category": "Legs", "equipment": ["Barbell", "Machine"] },
  { "name": "Lunge", "category": "Legs", "equipment": ["Dumbbell", "Barbell"], "variants": ["Walking", "Bulgarian"] },
  { "name": "Calf Raise", "category": "Legs", "equipment": ["Machine", "Bodyweight", "Barbell"] },
  { "name": "Hip Abduction", "category": "Legs", "equipment": ["Machine"] },
  { "name": "Hip Adduction", "category": "Legs", "equipment": ["Machine"] },
  { "name": "Shoulder Press", "category": "Shoulders", "equipment": ["Barbell", "Dumbbell", "Machine"] },
  { "name": "Lateral Raise", "category": "Shoulders", "equipment": ["Dumbbell", "Cable"] },
  { "name": "Front Raise", "category": "Shoulders", "equipment": ["Dumbbell", "Cable"] },
  { "name": "Rear Delt Fly", "category": "Shoulders", "equipment": ["Machine", "Dumbbell"] },
  { "name": "Face Pull", "category": "Shoulders", "equipment": ["Cable"] },
  { "name": "Upright Row", "category": "Shoulders", "equipment": ["Barbell", "Cable"] },
  { "name": "Biceps Curl", "category": "Biceps", "equipment": ["Barbell", "Dumbbell", "Cable", "Machine"], "variants": ["Standard", "Hammer", "Preacher"] },
  { "name": "Triceps Extension", "category": "Triceps", "equipment": ["Cable", "Dumbbell", "Barbell"], "variants": ["Pushdown", "Overhead", "Skull Crusher"] },
  { "name": "Dip", "category": "Triceps", "equipment": ["Bodyweight", "Machine"] },
  { "name": "Close Grip Bench Press", "category": "Triceps", "equipment": ["Barbell"] },
  { "name": "Plank", "category": "Abs", "equipment": ["Bodyweight"] },
  { "name": "Leg Raise", "category": "Abs", "equipment": ["Bodyweight"], "variants": ["Hanging", "Lying"] },
  { "name": "Crunch", "category": "Abs", "equipment": ["Machine", "Cable", "Bodyweight"] },
  { "name": "Ab Wheel Rollout", "category": "Abs", "equipment": ["Ab Wheel"] },
  { "name": "Russian Twist", "category": "Abs", "equipment": ["Bodyweight", "Weight"] },
  { "name": "Sit-Up", "category": "Abs", "equipment": ["Bodyweight", "Weight"] }
];

let selectedExercisesForPlan = [];
let editingPlanId = null;

export async function renderPlanEditor(planId = null, planName = "") {
    const container = document.getElementById("exercises");
    selectedExercisesForPlan = []; 
    editingPlanId = planId;

    container.innerHTML = `
        <div style="padding: 10px;">
            <button onclick="window.navigate('workout')" style="background: transparent; border: none; color: var(--primary); padding: 0; margin-bottom: 20px; font-size: 16px; font-weight: 600; cursor: pointer;">← Cancel</button>
            <h2 style="margin-top:0; margin-bottom: 20px;">${editingPlanId ? 'Edit Plan' : 'Create New Plan'}</h2>
            
            <div class="exercise-card">
                <input type="text" id="new-plan-name" value="${planName}" placeholder="Plan name (e.g. Push Day)" style="text-align:left; padding-left:15px; margin-bottom:20px; font-weight: 600;">
                
                <div id="exercises-setup"></div>
                
                <button id="add-ex-btn" class="btn-nav btn-signup" style="width:100%; margin-top:10px; border: 2px dashed var(--primary); padding: 15px; font-size: 16px; background: transparent; color: var(--primary); font-weight: bold; cursor: pointer; border-radius: 14px;">
                    + Add Exercise
                </button>
                
                <div style="margin-top:30px;">
                    <button id="save-plan-btn" class="save-btn" style="background:var(--success);">${editingPlanId ? 'Update Plan' : 'Save Workout Plan'}</button>
                </div>
            </div>
        </div>
    `;

    if (editingPlanId) {
        try {
            const res = await authFetch(`${API_URL}/plan-exercises/${editingPlanId}`);
            const existing = await res.json();
            if (existing && existing.length > 0) {
                selectedExercisesForPlan = existing.map(e => ({
                    id: e.exercise_id || e.exercise_name.replace(/\s+/g, '-').toLowerCase(),
                    name: e.exercise_name,
                    category: e.category,
                    sets: e.target_sets
                }));
            }
        } catch (e) {
            console.error("Failed to load existing exercises");
        }
    }

    document.getElementById('add-ex-btn').addEventListener('click', () => {
        window.openExerciseWizard((newExercise) => {
            const isDuplicate = selectedExercisesForPlan.some(ex => ex.id === newExercise.id);
            if (isDuplicate) {
                alert("This exercise is already in your plan. You can increase the number of sets instead.");
                return;
            }

            selectedExercisesForPlan.push({
                id: newExercise.id,
                name: newExercise.name,
                category: newExercise.category,
                sets: 3 
            });
            window.renderSelectedList();
        });
    });

    document.getElementById('save-plan-btn').addEventListener('click', () => {
        window.saveFullPlan();
    });
    
    window.renderSelectedList();
}

window.renderSelectedList = () => {
    const list = document.getElementById("exercises-setup");
    list.innerHTML = "";
    
    if (selectedExercisesForPlan.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#8e8e93; font-size:14px; margin-bottom:20px;">No exercises added yet.</p>`;
        return;
    }

    selectedExercisesForPlan.forEach((ex, index) => {
        const div = document.createElement("div");
        div.className = "selected-ex-row";
        div.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:15px; background:rgba(0,0,0,0.3); border-radius:12px; margin-bottom:10px; border:1px solid var(--border);";
        div.innerHTML = `
            <div style="flex:1;">
                <div style="font-weight:600; font-size:15px; color:var(--text); line-height: 1.2;">${ex.name}</div>
                <div style="font-size:12px; color:var(--primary); margin-top: 4px; font-weight: 600;">${ex.category}</div>
            </div>
            <div style="display:flex; align-items:center; gap:15px;">
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <label style="font-size:12px; color:#8e8e93; font-weight: 600; margin-bottom:4px;">Sets</label>
                    <input type="number" class="ex-sets" data-index="${index}" value="${ex.sets}" min="1" max="10" onchange="window.updateSets(${index}, this.value)" style="width:50px; padding:10px 5px; margin:0; text-align:center; border-radius:10px; font-size: 16px !important; background:rgba(255,255,255,0.05);">
                </div>
                <button type="button" onclick="window.removeExercise(${index})" style="background:none; border:none; color:var(--danger); font-size:28px; padding:5px; cursor:pointer; display:flex; align-items:center;">&times;</button>
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

window.saveFullPlan = async () => {
    const nameInput = document.getElementById("new-plan-name");
    const planName = nameInput.value.trim();
    if (!planName) return alert("Enter a plan name");

    if (selectedExercisesForPlan.length === 0) return alert("Add at least one exercise");

    const saveBtn = document.getElementById('save-plan-btn');
    saveBtn.innerText = "Saving...";
    saveBtn.disabled = true;

    try {
        let finalPlanId = editingPlanId;

        if (!editingPlanId) {
            const res = await authFetch(`${API_URL}/plans`, {
                method: "POST", headers: {"Content-Type":"application/json"},
                body: JSON.stringify({ name: planName, user_id: parseInt(state.currentUserId) })
            });
            const planData = await res.json();
            finalPlanId = planData.id;
        } else {
            await authFetch(`${API_URL}/plan/${finalPlanId}`, {
                method: "PUT", headers: {"Content-Type":"application/json"},
                body: JSON.stringify({ name: planName })
            });
            await authFetch(`${API_URL}/plan-exercises/${finalPlanId}`, { method: "DELETE" });
        }

        for (const ex of selectedExercisesForPlan) {
            await authFetch(`${API_URL}/plan-exercises`, {
                method: "POST", headers: {"Content-Type":"application/json"},
                body: JSON.stringify({ plan_id: finalPlanId, exercise_id: ex.id, target_sets: ex.sets, exercise_name: ex.name, category: ex.category })
            });
        }
        window.navigate('workout');
    } catch (e) {
        alert("Save failed");
        saveBtn.innerText = editingPlanId ? "Update Plan" : "Save Workout Plan";
        saveBtn.disabled = false;
    }
};

// =========================================
// INTERACTIVE EXERCISE WIZARD LOGIC
// =========================================
window.openExerciseWizard = (onComplete) => {
    let wizardModal = document.getElementById('exercise-wizard');
    
    // BUDUJEMY SZKIELET MODALA TYLKO RAZ
    if (!wizardModal) {
        wizardModal = document.createElement('div');
        wizardModal.id = 'exercise-wizard';
        wizardModal.className = 'modal-overlay';
        
        wizardModal.innerHTML = `
            <div class="modal-content" style="height: auto; max-height: 80%;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center;">
                        <button id="wizard-back-btn" onclick="window.wizardBack()" style="background:none; border:none; color:var(--text); font-size:24px; cursor:pointer; margin-right:15px; padding:0; display:none;">←</button>
                        <h3 id="wizard-title" style="margin:0; font-size:18px; color:var(--primary);">Select Muscle Group</h3>
                    </div>
                    <button onclick="window.wizardClose()" style="background:none; border:none; color:#8e8e93; font-size:24px; cursor:pointer; padding:0;">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="wizard-grid" class="tile-grid">
                        </div>
                </div>
            </div>
        `;
        document.body.appendChild(wizardModal);
    }

    let selection = {
        category: null,
        baseExercise: null,
        equipment: null,
        angle: null,
        variant: null
    };

    const categories = [...new Set(EXERCISES_DB.map(e => e.category))];

    // FUNKCJA TYLKO ODŚWIEŻAJĄCA ŚRODEK OKNA
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
            title = `Select ${selection.category} Exercise`;
            items = EXERCISES_DB.filter(e => e.category === selection.category).map(e => e.name);
            onClick = (val) => { 
                selection.baseExercise = EXERCISES_DB.find(e => e.name === val); 
                renderView(); 
            };
        } 
        else {
            const ex = selection.baseExercise;
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
                // Koniec ścieżki - budujemy nazwę
                const nameParts = [selection.angle, selection.variant, selection.equipment, selection.baseExercise.name];
                const finalName = nameParts.filter(Boolean).join(" ");
                const finalId = finalName.replace(/\s+/g, '-').toLowerCase();

                wizardModal.classList.remove('show');
                setTimeout(() => wizardModal.remove(), 300);
                
                onComplete({
                    id: finalId,
                    name: finalName,
                    category: selection.category
                });
                return;
            }
        }

        // Aktualizacja DOM bez niszczenia modala
        document.getElementById('wizard-title').innerText = title;
        document.getElementById('wizard-back-btn').style.display = showBack ? 'block' : 'none';
        
        const tilesHtml = items.map(item => `
            <div class="wizard-tile" onclick="window.wizardSelect('${item}')">
                ${item}
            </div>
        `).join('');

        document.getElementById('wizard-grid').innerHTML = tilesHtml;
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

    wizardModal.classList.add('show');
    renderView();
};