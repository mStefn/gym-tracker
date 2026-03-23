import { state, API_URL, authFetch } from './state.js';

/**
 * Renders the active workout session based on a specific plan
 */
export async function renderWorkout(planId, planName) {
    const container = document.getElementById("exercises");
    container.innerHTML = `<div class="spinner" style="margin-top: 50px;"></div>`;

    try {
        // Fetch exercises assigned to the selected plan
        const res = await authFetch(`${API_URL}/plan-exercises/${planId}`);
        const exercises = await res.json();

        container.innerHTML = `
            <div style="padding: 10px;">
                <button onclick="window.navigate('workout')" class="back-link">← Back to Workouts</button>
                <h2 class="workout-title">${planName}</h2>
                <div id="workout-content"></div>
                <button onclick="window.navigate('workout')" class="save-btn success-bg" style="margin-top: 20px;">Finish Workout</button>
            </div>
        `;

        // Efficiently fetch last results for all sets in parallel
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
        const renderedExercises = new Set();

        for (const { ex, s, last } of results) {
            // Create a new card for each exercise if it doesn't exist yet
            if (!renderedExercises.has(ex.exercise_id)) {
                const card = document.createElement("div");
                card.className = "exercise-card";
                card.innerHTML = `<h3>${ex.exercise_name}</h3><div id="ex-${ex.exercise_id}"></div>`;
                document.getElementById("workout-content").appendChild(card);
                renderedExercises.add(ex.exercise_id);
            }

            // Logic for Progressive Overload targets
            let targetInfo = "Target: Push yourself!";
            const savedTargetStr = localStorage.getItem(`target_${state.currentUserId}_${ex.exercise_id}_${s}`);
            
            if (savedTargetStr) {
                try {
                    const savedTarget = JSON.parse(savedTargetStr);
                    targetInfo = `Tgt: ${savedTarget.weight.toFixed(1)}kg x ${savedTarget.reps}`;
                } catch(e) { console.error("Target Parsing Error", e); }
            } else if (last.weight > 0) {
                // Auto-suggest: If previous reps >= 10, suggest adding 0.5kg
                const nextWeight = last.reps >= 10 ? last.weight + 0.5 : last.weight;
                targetInfo = `Tgt: ${nextWeight.toFixed(1)}kg x ${last.reps}`;
            }

            // Build the set row
            const row = document.createElement("div");
            row.className = "set-row-container";
            
            const safeExName = ex.exercise_name.replace(/'/g, "\\'");
            let prevDisplay = '-';
            if (last.weight > 0) {
                const failureTag = last.is_failure ? '<span class="failure-indicator"> F</span>' : '';
                prevDisplay = `${last.weight}kg x ${last.reps}${failureTag}`;
            }

            row.innerHTML = `
                <div class="set-row-header">
                    <div class="set-number-badge">S${s}</div>
                    
                    <div class="set-stat-box">
                        <div class="stat-label">Previous</div>
                        <div class="stat-value">${prevDisplay}</div>
                        <div id="target-${ex.exercise_id}-${s}" class="target-indicator">${targetInfo}</div>
                    </div>

                    <div class="set-stat-box text-right">
                        <div class="stat-label">Today</div>
                        <div id="today-${ex.exercise_id}-${s}" class="current-value">-</div>
                    </div>
                </div>

                <form onsubmit="event.preventDefault();" class="set-input-form">
                    <div class="input-group">
                        <label>Reps</label>
                        <input type="number" inputmode="numeric" pattern="[0-9]*" class="reps-in" 
                               id="reps-${ex.exercise_id}-${s}" 
                               onkeydown="window.handleRepsEnter(event, 'weight-${ex.exercise_id}-${s}')">
                    </div>
                    
                    <div class="input-group">
                        <label>kg</label>
                        <input type="number" inputmode="decimal" class="weight-in" 
                               id="weight-${ex.exercise_id}-${s}" 
                               onkeydown="window.handleWeightEnter(event, this, ${ex.exercise_id}, ${s}, '${safeExName}')">
                    </div>
                    
                    <label class="failure-checkbox-label">
                        Failure?
                        <input type="checkbox" id="fail-${ex.exercise_id}-${s}" class="fail-checkbox">
                    </label>

                    <button type="button" id="btn-${ex.exercise_id}-${s}" 
                            onclick="window.saveSet(this, ${ex.exercise_id}, ${s}, '${safeExName}')" 
                            class="save-set-btn">Save</button>
                </form>
            `;
            document.getElementById(`ex-${ex.exercise_id}`).appendChild(row);
        }
    } catch (err) {
        console.error("Workout Render Error:", err);
        container.innerHTML = `<p class="error-text">Error: Backend connection failed.</p>`;
    }
}

/**
 * Sends set data to the server and triggers the Overload Modal
 */
export async function saveSet(btn, exId, setNum, exName) {
    const repsVal = document.getElementById(`reps-${exId}-${setNum}`).value;
    const weightVal = document.getElementById(`weight-${exId}-${setNum}`).value;
    const isFailure = document.getElementById(`fail-${exId}-${setNum}`).checked;

    if (!repsVal || !weightVal) return alert("Please enter both weight and reps.");

    btn.innerHTML = "...";
    btn.disabled = true;

    try {
        const res = await authFetch(`${API_URL}/log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                exercise_id: exId,
                set_number: setNum,
                reps: parseInt(repsVal),
                weight: parseFloat(weightVal),
                is_failure: isFailure
            })
        });

        if (res.ok) {
            // UI Feedback
            btn.innerHTML = "✓";
            btn.className += " success-btn";
            
            document.getElementById(`reps-${exId}-${setNum}`).disabled = true;
            document.getElementById(`weight-${exId}-${setNum}`).disabled = true;
            document.getElementById(`fail-${exId}-${setNum}`).disabled = true;
            
            const failureTag = isFailure ? '<span class="failure-indicator"> F</span>' : '';
            document.getElementById(`today-${exId}-${setNum}`).innerHTML = `${weightVal}kg x ${repsVal}${failureTag}`;
            
            // Show Progressive Overload suggestion
            window.showOverloadModal(exId, setNum, parseFloat(weightVal), parseInt(repsVal), exName);
        }
    } catch (e) {
        console.error("Save Set Error:", e);
        alert("Failed to save set. Check connection.");
        btn.innerHTML = "Save";
        btn.disabled = false;
    }
}

/**
 * UI Component for Progressive Overload suggestions
 */
window.showOverloadModal = (exId, setNum, currentWeight, currentReps, exName) => {
    let nextWeight = currentReps >= 10 ? currentWeight + 0.5 : currentWeight;
    let nextReps = currentReps;

    const modal = document.createElement("div");
    modal.className = "modal-overlay dialog-overlay";
    modal.id = "overload-modal";

    modal.innerHTML = `
        <div class="modal-content modal-content-small">
            <div class="modal-header centered">
                <h3 style="margin:0; font-size:20px;">Progressive Overload</h3>
            </div>
            <div class="modal-body centered">
                <p class="overload-subtitle">
                    Set your target for next time on:<br>
                    <strong class="highlight">${exName} (Set ${setNum})</strong>
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
            <div class="modal-footer flex-gap">
                <button onclick="window.closeOverload()" class="btn-secondary flex-1">Skip</button>
                <button id="confirm-overload-btn" class="btn-success flex-2">Confirm Target</button>
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

/**
 * Keyboard Handling: Enter moves focus from Reps to Weight
 */
window.handleRepsEnter = (e, nextFieldId) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const nextField = document.getElementById(nextFieldId);
        if (nextField) nextField.focus();
    }
};

/**
 * Keyboard Handling: Enter on Weight saves the set
 */
window.handleWeightEnter = (e, inputElement, exId, setNum, exName) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        inputElement.blur(); // Hides mobile keyboard
        const btn = document.getElementById(`btn-${exId}-${setNum}`);
        if (btn && !btn.disabled) {
            window.saveSet(btn, exId, setNum, exName);
        }
    }
};

// Global Exposure for event handlers
window.renderWorkout = renderWorkout;
window.saveSet = saveSet;