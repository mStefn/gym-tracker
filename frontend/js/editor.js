import { state, API_URL } from './state.js';

export function renderPlanEditor() {
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="padding: 20px;">
            <button onclick="location.reload()" class="nav-link">← Cancel</button>
            <h2 style="margin-top:20px;">New Plan</h2>
            
            <div class="exercise-card">
                <input type="text" id="new-plan-name" placeholder="Plan Name (e.g. Push Day)" style="margin-bottom:20px; text-align:left; padding-left:15px;">
                
                <div id="exercises-setup">
                    </div>
                
                <button onclick="addExerciseField()" class="btn-nav btn-signup" style="width:100%; margin-top:10px; border-style:dashed;">+ Add Exercise</button>
                
                <div style="margin-top:30px;">
                    <button onclick="saveFullPlan()" class="save-btn" style="background:var(--success);">Save Training Plan</button>
                </div>
            </div>
        </div>
    `;
    // Dodaj pierwsze dwa pola na start dla wygody
    addExerciseField();
    addExerciseField();
}

window.addExerciseField = () => {
    const div = document.createElement("div");
    div.className = "exercise-row-setup";
    div.style = "display:flex; gap:10px; margin-bottom:12px; align-items:center;";
    div.innerHTML = `
        <input type="text" class="ex-name" placeholder="Exercise" style="flex:2; margin:0; text-align:left; padding-left:10px;">
        <input type="number" class="ex-sets" placeholder="Sets" style="flex:0.8; margin:0;" min="1" max="15" value="3">
        <button onclick="this.parentElement.remove()" style="background:none; border:none; color:#ff453a; font-size:20px; padding:0 5px;">✕</button>
    `;
    document.getElementById("exercises-setup").appendChild(div);
};

window.saveFullPlan = async () => {
    const nameInput = document.getElementById("new-plan-name");
    const planName = nameInput.value.trim();
    
    if (!planName) return alert("Please enter a plan name");

    const rows = document.querySelectorAll(".exercise-row-setup");
    const exercises = [];
    rows.forEach(row => {
        const name = row.querySelector(".ex-name").value.trim();
        const sets = parseInt(row.querySelector(".ex-sets").value);
        if (name && sets) exercises.push({ name, sets });
    });

    if (exercises.length === 0) return alert("Add at least one exercise");

    try {
        // 1. Stwórz nagłówek planu
        const planRes = await fetch(`${API_URL}/plans`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ name: planName, user_id: parseInt(state.currentUserId) })
        });
        
        if (!planRes.ok) throw new Error("Failed to create plan");
        const planData = await planRes.json();
        
        // 2. Dodaj ćwiczenia jedno po drugim
        for (const ex of exercises) {
            await fetch(`${API_URL}/plan-exercises`, {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({ plan_id: planData.id, name: ex.name, target_sets: ex.sets })
            });
        }

        alert("Plan saved!");
        location.reload();
    } catch (e) {
        alert("Error saving plan: " + e.message);
    }
};