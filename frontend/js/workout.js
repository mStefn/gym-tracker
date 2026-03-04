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

            let targetInfo = "Target: Set it!";
            const savedTargetStr = localStorage.getItem(`target_${state.currentUserId}_${ex.exercise_id}_${s}`);
            
            if (savedTargetStr) {
                try {
                    const savedTarget = JSON.parse(savedTargetStr);
                    targetInfo = `Tgt: ${savedTarget.weight.toFixed(1)}kg x ${savedTarget.reps}`;
                } catch(e){}
            } else if (last.weight > 0) {
                const nextWeight = last.reps >= 10 ? last.weight + 0.5 : last.weight;
                targetInfo = `Tgt: ${nextWeight.toFixed(1)}kg x ${last.reps}`;
            }

            const row = document.createElement("div");
            row.className = "set-row";
            row.style = "display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 12px;";
            
            const safeExName = ex.exercise_name.replace(/'/g, "\\'");

            row.innerHTML = `
                <div style="font-weight:bold; color:var(--primary); font-size:16px; width: 25px;">S${s}</div>
                
                <div style="flex: 1; min-width: 50px;">
                    <div style="font-size: 10px; color: #8e8e93;">Prev</div>
                    <div style="font-weight: 600; font-size: 12px;">${last.weight > 0 ? `${last.weight}kg x ${last.reps}` : '-'}</div>
                    <div id="target-${ex.exercise_id}-${s}" style="font-size:10px; color:var(--success); font-weight:700; margin-top:2px;">${targetInfo}</div>
                </div>

                <div style="flex: 1; min-width: 50px;">
                    <div style="font-size: 10px; color: #8e8e93;">Today</div>
                    <div id="today-${ex.exercise_id}-${s}" style="font-weight: 600; font-size: 12px; color: var(--primary);">-</div>
                </div>

                <input type="number" class="reps-in" placeholder="Reps" id="reps-${ex.exercise_id}-${s}" style="width:45px; margin:0 2px; padding:8px 4px; font-size:13px; text-align:center;">
                <input type="number" class="weight-in" placeholder="kg" id="weight-${ex.exercise_id}-${s}" style="width:50px; margin:0 2px; padding:8px 4px; font-size:13px; text-align:center;">
                
                <button onclick="window.saveSet(this, ${ex.exercise_id}, ${s}, '${safeExName}')" class="btn-nav btn-login" style="width:48px; height:40px; padding:0; display:flex; align-items:center; justify-content:center; border-radius: 10px; font-size:12px;">Save</button>
            `;
            document.getElementById(`ex-${ex.exercise_id}`).appendChild(row);
        }
    } catch (err) {
        container.innerHTML = `<p style="color:var(--danger)">Error: Backend connection failed.</p>`;
    }
}

export async function saveSet(btn, exId, setNum, exName) {
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
            
            document.getElementById(`today-${exId}-${setNum}`).innerText = `${weightVal}kg x ${repsVal}`;
            
            window.showOverloadModal(exId, setNum, parseFloat(weightVal), parseInt(repsVal), exName);
        }
    } catch (e) {
        alert("Error!");
        btn.innerHTML = "Save";
        btn.disabled = false;
    }
}

window.showOverloadModal = (exId, setNum, currentWeight, currentReps, exName) => {
    let nextWeight = currentReps >= 10 ? currentWeight + 0.5 : currentWeight;
    let nextReps = currentReps >= 10 ? 8 : currentReps;

    const modal = document.createElement("div");
    modal.className = "modal-overlay dialog-overlay";
    modal.id = "overload-modal";

    modal.innerHTML = `
        <div class="modal-content modal-content-small">
            <div class="modal-header" style="justify-content: center; padding-bottom: 10px;">
                <h3 style="margin:0; font-size:20px;">Progressive Overload 📈</h3>
            </div>
            <div class="modal-body" style="text-align: center; padding-top: 5px;">
                <p style="color: #8e8e93; margin-top: 0; font-size: 14px; margin-bottom: 25px;">
                    Set your target for next time on:<br>
                    <strong style="color:var(--text);">${exName} (Set ${setNum})</strong>
                </p>
                
                <div class="stepper-row">
                    <span class="stepper-label">Weight (kg)</span>
                    <div class="stepper-controls">
                        <button class="stepper-btn" onclick="window.changeVal('weight', -0.5)">-</button>
                        <div class="stepper-val" id="val-weight">${nextWeight.toFixed(1)}</div>
                        <button class="stepper-btn" onclick="window.changeVal('weight', 0.5)">+</button>
                    </div>
                </div>

                <div class="stepper-row">
                    <span class="stepper-label">Reps Target</span>
                    <div class="stepper-controls">
                        <button class="stepper-btn" onclick="window.changeVal('reps', -1)">-</button>
                        <div class="stepper-val" id="val-reps">${nextReps}</div>
                        <button class="stepper-btn" onclick="window.changeVal('reps', 1)">+</button>
                    </div>
                </div>
            </div>
            <div class="modal-footer" style="display: flex; gap: 15px;">
                <button onclick="window.closeOverload()" class="save-btn" style="background: var(--card-bg); color: var(--text); border: 1px solid var(--border); flex: 1;">Skip</button>
                <button id="confirm-overload-btn" class="save-btn" style="background: var(--success); flex: 2;">Confirm Target</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    window.changeVal = (type, amount) => {
        if (type === 'weight') {
            nextWeight = Math.max(0, parseFloat((nextWeight + amount).toFixed(1)));
            document.getElementById('val-weight').innerText = nextWeight.toFixed(1);
        } else {
            nextReps = Math.max(1, nextReps + amount);
            document.getElementById('val-reps').innerText = nextReps;
        }
    };

    window.saveOverloadLocal = () => {
        const targetObj = { weight: nextWeight, reps: nextReps };
        localStorage.setItem(`target_${state.currentUserId}_${exId}_${setNum}`, JSON.stringify(targetObj));
        
        const targetDiv = document.getElementById(`target-${exId}-${setNum}`);
        if (targetDiv) targetDiv.innerText = `Tgt: ${nextWeight.toFixed(1)}kg x ${nextReps}`;
        
        window.closeOverload();
    };

    window.closeOverload = () => {
        if(document.body.contains(modal)) document.body.removeChild(modal);
    };

    document.getElementById('confirm-overload-btn').onclick = window.saveOverloadLocal;
};

// --- REJESTRACJA GLOBALNA ---
window.renderWorkout = renderWorkout;
window.saveSet = saveSet;