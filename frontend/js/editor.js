import { state, API_URL } from './state.js';

// Przechowujemy listę lokalnie w module
let availableExercises = null;

export async function renderPlanEditor() {
    const container = document.getElementById("exercises");
    
    // 1. Pokaż loader, żeby user wiedział, że coś się dzieje
    container.innerHTML = `
        <div style="text-align:center; margin-top:100px;">
            <div class="spinner"></div>
            <p style="color:#8e8e93; margin-top:20px;">Loading exercise library...</p>
        </div>
    `;

    try {
        // 2. Pobierz dane tylko jeśli ich jeszcze nie mamy
        if (!availableExercises) {
            const res = await fetch(`${API_URL}/exercises`);
            if (!res.ok) throw new Error("Server error");
            availableExercises = await res.json();
        }

        // 3. Buduj UI
        container.innerHTML = `
            <div style="padding: 20px;">
                <button onclick="location.reload()" class="nav-link">← Cancel</button>
                <h2 style="margin-top:20px;">Build Plan</h2>
                <div class="exercise-card">
                    <input type="text" id="new-plan-name" placeholder="Plan Name (e.g. Pull Day)" style="text-align:left; padding-left:15px; margin-bottom:20px;">
                    <div id="exercises-setup"></div>
                    
                    <button id="add-ex-btn" class="btn-nav btn-signup" style="width:100%; margin-top:10px; border-style:dashed;">
                        + Add Exercise
                    </button>
                    
                    <div style="margin-top:30px;">
                        <button onclick="saveFullPlan()" class="save-btn" style="background:var(--success);">Save Training Plan</button>
                    </div>
                </div>
            </div>
        `;

        // 4. Podepnij event listener zamiast onclick w HTML (bezpieczniejsze)
        document.getElementById('add-ex-btn').onclick = () => window.addExerciseField();
        
        // 5. Dodaj pierwsze pole na start
        window.addExerciseField();

    } catch (err) {
        console.error("Critical error:", err);
        container.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <p style="color:#ff453a;">⚠️ Error: Could not connect to database.</p>
                <button onclick="location.reload()" class="save-btn" style="margin-top:20px;">Try Again</button>
            </div>
        `;
    }
}

window.addExerciseField = () => {
    const setupArea = document.getElementById("exercises-setup");
    if (!setupArea || !availableExercises) return;

    const div = document.createElement("div");
    div.className = "exercise-row-setup";
    div.style = "display:flex; gap:10px; margin-bottom:12px; align-items:center;";
    
    // Generowanie pogrupowanej listy
    const categories = [...new Set(availableExercises.map(ex => ex.category))];
    let optionsHtml = '<option value="">Select exercise...</option>';
    
    categories.forEach(cat => {
        optionsHtml += `<optgroup label="--- ${cat} ---">`;
        availableExercises.filter(ex => ex.category === cat).forEach(ex => {
            optionsHtml += `<option value="${ex.id}">${ex.name}</option>`;
        });
        optionsHtml += `</optgroup>`;
    });

    div.innerHTML = `
        <select class="ex-id" style="flex:2; padding:12px; border-radius:12px; border:1px solid #d1d1d6; background:#fff; font-size:14px; color:var(--text);">
            ${optionsHtml}
        </select>
        <input type="number" class="ex-sets" value="3" style="flex:0.6; margin:0; padding:12px; text-align:center;">
        <button onclick="this.parentElement.remove()" style="background:none; border:none; color:#ff453a; font-size:22px; padding:0 5px;">✕</button>
    `;
    setupArea.appendChild(div);
};

window.saveFullPlan = async () => {
    const planName = document.getElementById("new-plan-name").value.trim();
    if (!planName) return alert("Enter plan name");

    const rows = document.querySelectorAll(".exercise-row-setup");
    const selections = [];
    rows.forEach(row => {
        const exerciseId = row.querySelector(".ex-id").value;
        const sets = parseInt(row.querySelector(".ex-sets").value);
        if (exerciseId && sets) selections.push({ exerciseId, sets });
    });

    if (selections.length === 0) return alert("Add at least one exercise");

    // Efekt "Saving..." na przycisku
    const saveBtn = document.querySelector('button[onclick="saveFullPlan()"]');
    saveBtn.innerText = "Saving...";
    saveBtn.disabled = true;

    try {
        const planRes = await fetch(`${API_URL}/plans`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ name: planName, user_id: parseInt(state.currentUserId) })
        });
        
        const planData = await planRes.json();
        for (const item of selections) {
            await fetch(`${API_URL}/plan-exercises`, {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({ 
                    plan_id: planData.id, 
                    exercise_id: parseInt(item.exerciseId), 
                    target_sets: item.sets 
                })
            });
        }
        location.reload();
    } catch (e) {
        alert("Error saving plan");
        saveBtn.innerText = "Save Training Plan";
        saveBtn.disabled = false;
    }
};