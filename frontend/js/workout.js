import { state, API_URL, authFetch } from './state.js';

export async function renderWorkout(planId, planName) {
    const container = document.getElementById("exercises");
    container.innerHTML = `<div class="spinner"></div>`;

    try {
        const res = await authFetch(`${API_URL}/plan-exercises/${planId}`);
        const exercises = await res.json();

        container.innerHTML = `
            <div style="padding: 10px;">
                <button onclick="location.reload()" class="nav-link">← Back</button>
                <h2 style="margin: 15px 0;">${planName}</h2>
                <div id="workout-content"></div>
            </div>
        `;

        // Build list of all set-fetch promises across all exercises
        const fetchTasks = [];
        for (const ex of exercises) {
            for (let s = 1; s <= ex.target_sets; s++) {
                fetchTasks.push(
                    authFetch(`${API_URL}/last/${state.currentUserId}/${ex.exercise_id}/${s}`)
                        .then(r => r.json())
                        .then(last => ({ ex, s, last }))
                );
            }
        }

        const results = await Promise.all(fetchTasks);

        // Render cards using pre-fetched data
        const rendered = new Set();
        for (const { ex, s, last } of results) {
            if (!rendered.has(ex.exercise_id)) {
                const card = document.createElement("div");
                card.className = "exercise-card";
                card.innerHTML = `<h3>${ex.exercise_name}</h3><div id="ex-${ex.exercise_id}"></div>`;
                document.getElementById("workout-content").appendChild(card);
                rendered.add(ex.exercise_id);
            }

            // Target logic: +2.5kg if reps >= 10
            let targetInfo = "Session 1";
            if (last.weight > 0) {
                const nextWeight = last.reps >= 10 ? last.weight + 2.5 : last.weight;
                targetInfo = `Target: ${nextWeight}kg x ${last.reps}`;
            }

            const row = document.createElement("div");
            row.className = "set-row";
            row.innerHTML = `
                <div style="font-weight:bold; color:var(--primary); font-size:18px;">S${s}</div>
                <div style="flex: 1.5;">
                    <span class="label-small">Previous</span>
                    <span class="history-val">${last.weight}kg x ${last.reps}</span>
                    <div style="font-size:10px; color:var(--success); font-weight:700; margin-top:2px;">${targetInfo}</div>
                </div>
                <input type="number" class="reps-in" placeholder="Reps" id="reps-${ex.exercise_id}-${s}" style="flex:0.8; margin:0; padding:10px;">
                <input type="number" class="weight-in" placeholder="kg" id="weight-${ex.exercise_id}-${s}" style="flex:0.8; margin:0; padding:10px;">
                <button onclick="saveSet(this, ${ex.exercise_id}, ${s})" class="btn-nav btn-login" style="width:45px; height:45px; padding:0; display:flex; align-items:center; justify-content:center;">ok</button>
            `;
            document.getElementById(`ex-${ex.exercise_id}`).appendChild(row);
        }
    } catch (err) {
        container.innerHTML = `<p style="color:red">Error: Backend connection failed.</p>`;
    }
}

export async function saveSet(btn, exId, setNum) {
    const repsVal = document.getElementById(`reps-${exId}-${setNum}`).value;
    const weightVal = document.getElementById(`weight-${exId}-${setNum}`).value;

    if (!repsVal || !weightVal) return alert("Fill data!");

    btn.innerHTML = "...";
    btn.disabled = true;

    try {
        const res = await authFetch(`${API_URL}/log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: parseInt(state.currentUserId),
                exercise_id: exId,
                set_number: setNum,
                reps: parseInt(repsVal),
                weight: parseFloat(weightVal)
            })
        });

        if (res.ok) {
            btn.innerHTML = "✓";
            btn.style.background = "var(--success)";
            btn.style.borderColor = "var(--success)";
            document.getElementById(`reps-${exId}-${setNum}`).disabled = true;
            document.getElementById(`weight-${exId}-${setNum}`).disabled = true;
        }
    } catch (e) {
        alert("Error!");
        btn.innerHTML = "ok";
        btn.disabled = false;
    }
}

// Register global functions for dashboard and buttons
window.renderWorkout = renderWorkout;
window.saveSet = saveSet;