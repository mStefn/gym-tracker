import { state, API_URL } from './state.js';

let availableExercises = [];

export async function renderPlanEditor() {
    const container = document.getElementById("exercises");
    
    try {
        // 1. Najpierw pobierz dane
        const res = await fetch(`${API_URL}/exercises`);
        availableExercises = await res.json();

        // 2. Dopiero gdy mamy dane, buduj interfejs
        container.innerHTML = `
            <div style="padding: 20px;">
                <button onclick="location.reload()" class="nav-link">← Cancel</button>
                <h2 style="margin-top:20px;">New Workout</h2>
                <div class="exercise-card">
                    <input type="text" id="new-plan-name" placeholder="Plan Name (e.g. Push Day)" style="text-align:left; padding-left:15px; margin-bottom:20px;">
                    <div id="exercises-setup"></div>
                    <button onclick="window.addExerciseField()" class="btn-nav btn-signup" style="width:100%; margin-top:10px; border-style:dashed;">+ Add Exercise</button>
                    <div style="margin-top:30px;">
                        <button onclick="saveFullPlan()" class="save-btn" style="background:var(--success);">Save Plan</button>
                    </div>
                </div>
            </div>
        `;
        
        // 3. Dodaj pierwsze pole dopiero teraz
        window.addExerciseField();

    } catch (err) {
        console.error("Failed to load exercises:", err);
        container.innerHTML = `<p style="color:red">Error loading exercises. Check backend.</p>`;
    }
}

window.addExerciseField = () => {
    // Zabezpieczenie: jeśli lista jest pusta, nie rób nic
    if (!availableExercises || availableExercises.length === 0) {
        console.warn("Exercises not loaded yet");
        return;
    }

    const div = document.createElement("div");
    div.className = "exercise-row-setup";
    div.style = "display:flex; gap:10px; margin-bottom:12px; align-items:center;";
    
    const categories = [...new Set(availableExercises.map(ex => ex.category))];
    let optionsHtml = '<option value="">Select...</option>';
    
    categories.forEach(cat => {
        optionsHtml += `<optgroup label="${cat}">`;
        availableExercises.filter(ex => ex.category === cat).forEach(ex => {
            optionsHtml += `<option value="${ex.id}">${ex.name}</option>`;
        });
        optionsHtml += `</optgroup>`;
    });

    div.innerHTML = `
        <select class="ex-id" style="flex:2; padding:12px; border-radius:12px; border:1px solid #d1d1d6; background:#fff; font-size:14px;">${optionsHtml}</select>
        <input type="number" class="ex-sets" value="3" style="flex:0.6; margin:0; text-align:center;">
        <button onclick="this.parentElement.remove()" style="background:none; border:none; color:#ff453a; font-size:22px;">✕</button>
    `;
    document.getElementById("exercises-setup").appendChild(div);
};

window.saveFullPlan = async () => {
    const name = document.getElementById("new-plan-name").value.trim();
    if (!name) return alert("Enter plan name");
    const rows = document.querySelectorAll(".exercise-row-setup");
    const selections = [];
    rows.forEach(row => {
        const id = row.querySelector(".ex-id").value;
        const sets = parseInt(row.querySelector(".ex-sets").value);
        if (id && sets) selections.push({ id, sets });
    });
    if (selections.length === 0) return alert("Add exercises");

    const res = await fetch(`${API_URL}/plans`, {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ name: name, user_id: parseInt(state.currentUserId) })
    });
    const data = await res.json();
    for (const s of selections) {
        await fetch(`${API_URL}/plan-exercises`, {
            method: "POST", headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ plan_id: data.id, exercise_id: parseInt(s.id), target_sets: s.sets })
        });
    }
    location.reload();
};