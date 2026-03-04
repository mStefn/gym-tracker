import { state, API_URL, authFetch } from './state.js';

export async function renderWorkout(planId, planName) {
    const container = document.getElementById("exercises");
    container.innerHTML = `<div class="spinner" style="margin-top: 50px;"></div>`;

    try {
        const res = await authFetch(`${API_URL}/plan-exercises/${planId}`);
        const exercises = await res.json();

        container.innerHTML = `
            <div style="padding: 10px;">
                <button onclick="window.navigate('workout')" style="background: transparent; border: none; color: var(--primary); padding: 0; margin-bottom: 20px; font-size: 16px; font-weight: 600; cursor: pointer;">← Back to Workouts</button>
                <h2 style="margin: 0px 0 15px 0;">${planName}</h2>
                <div id="workout-content"></div>
                <button onclick="window.navigate('workout')" class="save-btn" style="margin-top: 20px; background: var(--success);">Finish Workout 🏆</button>
            </div>
        `;

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

        const rendered = new Set();
        for (const { ex, s, last } of results) {
            if (!rendered.has(ex.exercise_id)) {
                const card = document.createElement("div");
                card.className = "exercise-card";
                card.innerHTML = `<h3>${ex.exercise_name}</h3><div id="ex-${ex.exercise_id}"></div>`;
                document.getElementById("workout-content").appendChild(card);
                rendered.add(ex.exercise_id);
            }

            let targetInfo = "Session 1";
            if (last.weight > 0) {
                const nextWeight = last.reps >= 10 ? last.weight + 2.5 : last.weight;
                targetInfo = `Target: ${nextWeight}kg x ${last.reps}`;
            }

            const row = document.createElement("div");
            row.className = "set-row";
            row.style = "display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 12px;";
            row.innerHTML = `
                <div style="font-weight:bold; color:var(--primary); font-size:18px; width: 35px;">S${s}</div>
                <div style="flex: 1.5;">
                    <span class="label-small" style="font-size: 12px; color: #8e8e93;">Previous</span><br>
                    <span class="history-val" style="font-weight: 600;">${last.weight}kg x ${last.reps}</span>
                    <div style="font-size:11px; color:var(--success); font-weight:700; margin-top:2px;">${targetInfo}</div>
                </div>
                <input type="number" class="reps-in" placeholder="Reps" id="reps-${ex.exercise_id}-${s}" style="flex:0.8; margin:0 5px; padding:10px;">
                <input type="number" class="weight-in" placeholder="kg" id="weight-${ex.exercise_id}-${s}" style="flex:0.8; margin:0 5px; padding:10px;">
                <button onclick="saveSet(this, ${ex.exercise_id}, ${s})" class="btn-nav btn-login" style="width:45px; height:45px; padding:0; display:flex; align-items:center; justify-content:center; border-radius: 12px;">ok</button>
            `;
            document.getElementById(`ex-${ex.exercise_id}`).appendChild(row);
        }
    } catch (err) {
        container.innerHTML = `<p style="color:var(--danger)">Error: Backend connection failed.</p>`;
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

window.renderWorkout = renderWorkout;
window.saveSet = saveSet;