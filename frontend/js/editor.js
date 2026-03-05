import { state, API_URL, authFetch } from './state.js';

let exercisesCache = [];
let selectedExercisesForPlan = [];

export async function renderPlanEditor() {
    const container = document.getElementById("exercises");
    selectedExercisesForPlan = []; 
    
    container.innerHTML = `
        <div style="text-align:center; margin-top:100px;">
            <div class="spinner"></div>
            <p style="color:#8e8e93; margin-top:20px;">Loading database...</p>
        </div>
    `;

    try {
        const res = await authFetch(`${API_URL}/exercises`);
        if (!res.ok) throw new Error("Server error");
        exercisesCache = await res.json(); // Pobrana nowa wielka baza wygenerowana przez Go

        container.innerHTML = `
            <div style="padding: 10px;">
                <button onclick="window.navigate('workout')" style="background: transparent; border: none; color: var(--primary); padding: 0; margin-bottom: 20px; font-size: 16px; font-weight: 600; cursor: pointer;">← Cancel</button>
                <h2 style="margin-top:0; margin-bottom: 20px;">Create New Plan</h2>
                
                <div class="exercise-card">
                    <input type="text" id="new-plan-name" placeholder="Plan name (e.g. Chest + Biceps)" style="text-align:left; padding-left:15px; margin-bottom:20px; font-weight: 600;">
                    
                    <div id="exercises-setup"></div>
                    
                    <button id="add-ex-btn" class="btn-nav btn-signup" style="width:100%; margin-top:10px; border: 2px dashed var(--primary); padding: 15px; font-size: 16px;">
                        + Add Exercise
                    </button>
                    
                    <div style="margin-top:30px;">
                        <button id="save-plan-btn" class="save-btn" style="background:var(--success);">Save Workout Plan</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('add-ex-btn').addEventListener('click', () => {
            // Wywołujemy nowy Wizard zdefiniowany w state.js!
            window.openExerciseWizard((finalName) => {
                // Znajdujemy wygenerowane ćwiczenie w bazie cache pobranej z backendu
                const foundEx = exercisesCache.find(e => e.name === finalName);
                if (foundEx) {
                    selectedExercisesForPlan.push(foundEx.id);
                    window.renderSelectedList();
                } else {
                    alert(`System Error: Exercise "${finalName}" not found in DB!`);
                }
            });
        });

        document.getElementById('save-plan-btn').addEventListener('click', () => {
            window.saveFullPlan();
        });
        
        window.renderSelectedList();

    } catch (err) {
        container.innerHTML = `<p style="color:var(--danger); text-align:center;">Failed to load exercises.</p>`;
    }
}

window.renderSelectedList = () => {
    const list = document.getElementById("exercises-setup");
    list.innerHTML = "";
    
    if (selectedExercisesForPlan.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#8e8e93; font-size:14px; margin-bottom:20px;">No exercises added yet.</p>`;
        return;
    }

    selectedExercisesForPlan.forEach((exId, index) => {
        const ex = exercisesCache.find(e => e.id === exId);
        if(!ex) return;

        const div = document.createElement("div");
        div.className = "selected-ex-row";
        div.innerHTML = `
            <div style="flex:1;">
                <div style="font-weight:600; font-size:14px; color:var(--text); line-height: 1.2;">${ex.name}</div>
                <div style="font-size:11px; color:var(--primary); margin-top: 4px; font-weight: 600;">${ex.category}</div>
            </div>
            <div style="display:flex; align-items:center; gap:15px;">
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <label style="font-size:11px; color:#8e8e93; font-weight: 600; margin-bottom:4px;">Sets</label>
                    <input type="number" class="ex-sets" data-index="${index}" data-id="${ex.id}" value="3" min="1" max="10" style="width:50px; padding:10px 5px; margin:0; text-align:center; border-radius:10px; font-size: 14px;">
                </div>
                <button type="button" onclick="window.removeExercise(${index})" style="background:none; border:none; color:var(--danger); font-size:24px; padding:5px; cursor:pointer; display:flex; align-items:center;">&times;</button>
            </div>
        `;
        list.appendChild(div);
    });
};

window.removeExercise = (indexToRemove) => {
    selectedExercisesForPlan.splice(indexToRemove, 1);
    window.renderSelectedList();
};

window.saveFullPlan = async () => {
    const nameInput = document.getElementById("new-plan-name");
    const planName = nameInput.value.trim();
    if (!planName) return alert("Enter a plan name");

    const inputs = document.querySelectorAll(".ex-sets");
    const selections = [];
    
    inputs.forEach(input => {
        const id = parseInt(input.getAttribute("data-id"));
        const sets = parseInt(input.value);
        if (id && sets) selections.push({ id, sets });
    });

    if (selections.length === 0) return alert("Add at least one exercise");

    const saveBtn = document.getElementById('save-plan-btn');
    saveBtn.innerText = "Saving...";
    saveBtn.disabled = true;

    try {
        const res = await authFetch(`${API_URL}/plans`, {
            method: "POST", headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ name: planName, user_id: parseInt(state.currentUserId) })
        });
        
        const planData = await res.json();
        for (const s of selections) {
            await authFetch(`${API_URL}/plan-exercises`, {
                method: "POST", headers: {"Content-Type":"application/json"},
                body: JSON.stringify({ plan_id: planData.id, exercise_id: s.id, target_sets: s.sets })
            });
        }
        window.navigate('workout');
    } catch (e) {
        alert("Save failed");
        saveBtn.innerText = "Save Workout Plan";
        saveBtn.disabled = false;
    }
};