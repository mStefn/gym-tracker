import { state, API_URL } from './state.js';

export function renderPlanEditor() {
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="padding: 20px;">
            <button onclick="location.reload()" class="nav-link">← Cancel</button>
            <h2 style="margin-top:20px;">Create New Plan</h2>
            
            <div class="exercise-card">
                <input type="text" id="new-plan-name" placeholder="Plan Name (e.g. Push Day)">
                <div id="exercises-setup" style="margin-top:20px;"></div>
                
                <button onclick="addExerciseField()" class="btn-nav btn-signup" style="width:100%; margin-top:10px;">+ Add Exercise</button>
                <button onclick="saveFullPlan()" class="save-btn" style="margin-top:20px; background:var(--success);">Save Plan</button>
            </div>
        </div>
    `;
    // Dodaj pierwsze pole na start
    window.addExerciseField();
}

window.addExerciseField = () => {
    const div = document.createElement("div");
    div.className = "exercise-row-setup";
    div.style = "display:flex; gap:10px; margin-bottom:10px;";
    div.innerHTML = `
        <input type="text" class="ex-name" placeholder="Exercise name" style="flex:2; margin:0;">
        <input type="number" class="ex-sets" placeholder="Sets" style="flex:1; margin:0;" min="1" max="10">
    `;
    document.getElementById("exercises-setup").appendChild(div);
};

window.saveFullPlan = async () => {
    const planName = document.getElementById("new-plan-name").value;
    if (!planName) return alert("Plan name is required");

    const rows = document.querySelectorAll(".exercise-row-setup");
    const exercises = [];
    rows.forEach(row => {
        const name = row.querySelector(".ex-name").value;
        const sets = parseInt(row.querySelector(".ex-sets").value);
        if (name && sets) exercises.push({ name, sets });
    });

    if (exercises.length === 0) return alert("Add at least one exercise");

    // 1. Stwórz plan
    const planRes = await fetch(`${API_URL}/plans`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ name: planName, user_id: parseInt(state.currentUserId) })
    });
    
    if (planRes.ok) {
        const planData = await planRes.json();
        
        // 2. Dodaj wszystkie ćwiczenia
        for (const ex of exercises) {
            await fetch(`${API_URL}/plan-exercises`, {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({ plan_id: planData.id, name: ex.name, target_sets: ex.sets })
            });
        }
        alert("Plan created successfully!");
        location.reload();
    }
};