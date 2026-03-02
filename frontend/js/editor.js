import { state, API_URL, authFetch } from './state.js';

// Module-level cache
let exercisesCache = null;

export async function renderPlanEditor() {
    const container = document.getElementById("exercises");
    
    // 1. Show loader
    container.innerHTML = `
        <div style="text-align:center; margin-top:100px;">
            <div class="spinner"></div>
            <p style="color:#8e8e93; margin-top:20px;">Loading exercise database...</p>
        </div>
    `;

    try {
        // 2. Fetch data
        const res = await authFetch(`${API_URL}/exercises`);
        if (!res.ok) throw new Error("Server error");
        exercisesCache = await res.json();

        // 3. Render editor skeleton
        container.innerHTML = `
            <div style="padding: 20px;">
                <button onclick="location.reload()" class="nav-link">← Cancel</button>
                <h2 style="margin-top:20px;">New Plan</h2>
                <div class="exercise-card">
                    <input type="text" id="new-plan-name" placeholder="Plan name (e.g. Chest + Biceps)" style="text-align:left; padding-left:15px; margin-bottom:20px;">
                    
                    <div id="exercises-setup"></div>
                    
                    <button id="add-ex-btn" class="btn-nav btn-signup" style="width:100%; margin-top:10px; border-style:dashed;">
                        + Add Exercise
                    </button>
                    
                    <div style="margin-top:30px;">
                        <button id="save-plan-btn" class="save-btn" style="background:var(--success);">Save Workout</button>
                    </div>
                </div>
            </div>
        `;

    // 4. Attach event listeners
        document.getElementById('add-ex-btn').addEventListener('click', () => {
            window.addExerciseField();
        });

        document.getElementById('save-plan-btn').addEventListener('click', () => {
            window.saveFullPlan();
        });
        
        // 5. Add first exercise row on start
        window.addExerciseField();

    } catch (err) {
        console.error("Editor error:", err);
        container.innerHTML = `<p style="color:red; text-align:center;">Failed to load exercises. Check server connection.</p>`;
    }
}

window.addExerciseField = () => {
    const setupArea = document.getElementById("exercises-setup");
    if (!setupArea || !exercisesCache) {
        console.error("Error: Attempted to add field without loaded data!");
        return;
    }

    const div = document.createElement("div");
    div.className = "exercise-row-setup";
    div.style = "display:flex; gap:10px; margin-bottom:12px; align-items:center;";
    
    const categories = [...new Set(exercisesCache.map(ex => ex.category))];
    let optionsHtml = '<option value="">Select exercise...</option>';
    
    categories.forEach(cat => {
        optionsHtml += `<optgroup label="${cat}">`;
        exercisesCache.filter(ex => ex.category === cat).forEach(ex => {
            optionsHtml += `<option value="${ex.id}">${ex.name}</option>`;
        });
        optionsHtml += `</optgroup>`;
    });

    div.innerHTML = `
        <select class="ex-id" style="flex:2; padding:12px; border-radius:12px; border:1px solid #d1d1d6; background:#fff; font-size:14px;">
            ${optionsHtml}
        </select>
        <input type="number" class="ex-sets" value="3" style="flex:0.6; margin:0; padding:12px; text-align:center;">
        <button type="button" class="remove-row-btn" style="background:none; border:none; color:#ff453a; font-size:22px; padding:0 5px;">✕</button>
    `;

    // Handle row removal
    div.querySelector('.remove-row-btn').onclick = () => div.remove();
    
    setupArea.appendChild(div);
};

window.saveFullPlan = async () => {
    const nameInput = document.getElementById("new-plan-name");
    const planName = nameInput.value.trim();
    if (!planName) return alert("Enter a plan name");

    const rows = document.querySelectorAll(".exercise-row-setup");
    const selections = [];
    rows.forEach(row => {
        const id = row.querySelector(".ex-id").value;
        const sets = parseInt(row.querySelector(".ex-sets").value);
        if (id && sets) selections.push({ id, sets });
    });

    if (selections.length === 0) return alert("Add at least one exercise");

    const saveBtn = document.getElementById('save-plan-btn');
    saveBtn.innerText = "Saving...";
    saveBtn.disabled = true;

    try {
        const res = await authFetch(`${API_URL}/plans`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ name: planName, user_id: parseInt(state.currentUserId) })
        });
        
        const planData = await res.json();
        for (const s of selections) {
            await authFetch(`${API_URL}/plan-exercises`, {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({ plan_id: planData.id, exercise_id: parseInt(s.id), target_sets: s.sets })
            });
        }
        location.reload();
    } catch (e) {
        alert("Save failed");
        saveBtn.innerText = "Save Workout";
        saveBtn.disabled = false;
    }
};