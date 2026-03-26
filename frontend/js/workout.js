import { state, API_URL, authFetch } from './state.js';

/**
 * Renders the active workout session based on a specific plan.
 * Optimized for mobile touch targets (Big Inputs).
 */
export async function renderWorkout(planId, planName) {
    const container = document.getElementById("exercises");
    container.innerHTML = `<div class="spinner" style="margin-top: 50px;"></div>`;

    try {
        // Fetch exercises assigned to the selected plan
        const res = await authFetch(`${API_URL}/plan-exercises/${planId}`);
        const exercises = await res.json();

        container.innerHTML = `
            <div class="workout-view-wrapper">
                <button onclick="globalThis.navigate('workout')" class="back-link">← Back to Workouts</button>
                <h2 class="workout-title">${planName}</h2>
                <div id="workout-content"></div>
                <button onclick="globalThis.navigate('workout')" class="save-btn success-bg finish-workout-btn">Finish Workout</button>
            </div>
        `;

        // Fetch last results for all sets in parallel for suggestions
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
            // Create exercise card if first set
            if (!renderedExercises.has(ex.exercise_id)) {
                const card = document.createElement("div");
                card.className = "exercise-card";
                card.innerHTML = `<h3 class="ex-card-title-main">${ex.exercise_name}</h3><div id="ex-${ex.exercise_id}"></div>`;
                document.getElementById("workout-content").appendChild(card);
                renderedExercises.add(ex.exercise_id);
            }

            // Progressive Overload Suggestion Logic
            let targetInfo = "Target: Push yourself!";
            const savedTargetStr = localStorage.getItem(`target_${state.currentUserId}_${ex.exercise_id}_${s}`);
            
            if (savedTargetStr) {
                try {
                    const savedTarget = JSON.parse(savedTargetStr);
                    targetInfo = `Tgt: ${savedTarget.weight.toFixed(1)}kg x ${savedTarget.reps}`;
                } catch(e) { console.error("Target Parsing Error", e); }
            } else if (last.weight > 0) {
                const nextWeight = last.reps >= 10 ? last.weight + 0.5 : last.weight;
                targetInfo = `Tgt: ${nextWeight.toFixed(1)}kg x ${last.reps}`;
            }

            const row = document.createElement("div");
            row.className = "set-row-container";
            
            const safeExName = ex.exercise_name.replace(/'/g, "\\'");
            let prevDisplay = '-';
            if (last.weight > 0) {
                const failureTag = last.is_failure ? '<span class="failure-indicator"> F</span>' : '';
                prevDisplay = `${last.weight}kg x ${last.reps}${failureTag}`;
            }

            // HTML Structure: Optimized for the new 2x2 Grid CSS
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
                               onkeydown="globalThis.handleRepsEnter(event, 'weight-${ex.exercise_id}-${s}')"
                               placeholder="0">
                    </div>
                    
                    <div class="input-group">
                        <label>kg</label>
                        <input type="number" inputmode="decimal" class="weight-in" 
                               id="weight-${ex.exercise_id}-${s}" 
                               onkeydown="globalThis.handleWeightEnter(event, this, ${ex.exercise_id}, ${s}, '${safeExName}')"
                               placeholder="0.0">
                    </div>
                    
                    <div class="action-group">
                        <label class="failure-checkbox-label">
                            <input type="checkbox" id="fail-${ex.exercise_id}-${s}" class="fail-checkbox">
                            <span>FAIL</span>
                        </label>

                        <button type="button" id="btn-${ex.exercise_id}-${s}" 
                                onclick="globalThis.saveSet(this, ${ex.exercise_id}, ${s}, '${safeExName}')" 
                                class="save-set-btn">SAVE SET</button>
                    </div>
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
 * Sends set data to the server and triggers UI feedback.
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
                reps: Number.parseInt(repsVal, 10),
                weight: Number.parseFloat(weightVal.replace(',', '.')),
                is_failure: isFailure
            })
        });

        if (res.ok) {
            btn.innerHTML = "✓ DONE";
            btn.className += " success-btn";
            
            document.getElementById(`reps-${exId}-${setNum}`).disabled = true;
            document.getElementById(`weight-${exId}-${setNum}`).disabled = true;
            document.getElementById(`fail-${exId}-${setNum}`).disabled = true;
            
            const failureTag = isFailure ? '<span class="failure-indicator"> F</span>' : '';
            document.getElementById(`today-${exId}-${setNum}`).innerHTML = `${weightVal}kg x ${repsVal}${failureTag}`;
            
            // Trigger THE UPGRADED NEON MODAL
            globalThis.showOverloadModal(exId, setNum, Number.parseFloat(weightVal.replace(',', '.')), Number.parseInt(repsVal, 10), exName);
        }
    } catch (e) {
        console.error("Save Set Error:", e);
        alert("Failed to save set.");
        btn.innerHTML = "SAVE SET";
        btn.disabled = false;
    }
}

/**
 * UI Component for Progressive Overload suggestions (NEON UPGRADE).
 */
globalThis.showOverloadModal = (exId, setNum, currentWeight, currentReps, exName) => {
    let nextWeight = currentReps >= 10 ? currentWeight + 0.5 : currentWeight;
    let nextReps = currentReps;

    const modal = document.createElement("div");
    modal.className = "modal-overlay dialog-overlay show";
    modal.id = "overload-modal";

    modal.innerHTML = `
        <div class="modal-content overload-card-upgrade">
            <div class="overload-header">
                <div class="overload-icon-badge">⚡</div>
                <h3 class="overload-title">Level Up Your Gains</h3>
            </div>
            
            <div class="modal-body centered">
                <p class="overload-subtitle">
                    Set your targets for the next session on:<br>
                    <span class="ex-highlight">${exName}</span> <span class="set-badge">Set ${setNum}</span>
                </p>
                
                <div class="stepper-container-modern">
                    <div class="modern-stepper">
                        <span class="stepper-label">Target Weight</span>
                        <div class="stepper-controls-v2">
                            <button class="step-btn-v2" onclick="globalThis.changeVal('weight', -0.5)">−</button>
                            <div class="step-display">
                                <span class="step-num-big" id="val-weight">${nextWeight.toFixed(1)}</span>
                                <span class="step-unit">kg</span>
                            </div>
                            <button class="step-btn-v2" onclick="globalThis.changeVal('weight', 0.5)">+</button>
                        </div>
                    </div>

                    <div class="modern-stepper">
                        <span class="stepper-label">Target Reps</span>
                        <div class="stepper-controls-v2">
                            <button class="step-btn-v2" onclick="globalThis.changeVal('reps', -1)">−</button>
                            <div class="step-display">
                                <span class="step-num-big" id="val-reps">${nextReps}</span>
                                <span class="step-unit">reps</span>
                            </div>
                            <button class="step-btn-v2" onclick="globalThis.changeVal('reps', 1)">+</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-footer overload-footer-v2">
                <button onclick="globalThis.closeOverload()" class="btn-skip-v2">Maybe Later</button>
                <button id="confirm-overload-btn" class="btn-confirm-v2">SET TARGET</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    globalThis.changeVal = (type, amount) => {
        if (type === 'weight') {
            nextWeight = Math.max(0, Number.parseFloat((nextWeight + amount).toFixed(1)));
            const el = document.getElementById('val-weight');
            if (el) el.innerText = nextWeight.toFixed(1);
        } else {
            nextReps = Math.max(1, nextReps + amount);
            const el = document.getElementById('val-reps');
            if (el) el.innerText = nextReps;
        }
    };

    globalThis.saveOverloadLocal = () => {
        const targetObj = { weight: nextWeight, reps: nextReps };
        localStorage.setItem(`target_${state.currentUserId}_${exId}_${setNum}`, JSON.stringify(targetObj));
        
        const targetDiv = document.getElementById(`target-${exId}-${setNum}`);
        if (targetDiv) targetDiv.innerText = `Tgt: ${nextWeight.toFixed(1)}kg x ${nextReps}`;
        
        globalThis.closeOverload();
    };

    globalThis.closeOverload = () => {
        const modalEl = document.getElementById('overload-modal');
        if(modalEl) {
            modalEl.classList.remove('show');
            setTimeout(() => modalEl.remove(), 200);
        }
    };

    const confirmBtn = document.getElementById('confirm-overload-btn');
    if (confirmBtn) confirmBtn.onclick = globalThis.saveOverloadLocal;
};

/**
 * Moves focus from Reps input to Weight input on 'Enter'.
 */
globalThis.handleRepsEnter = (e, nextFieldId) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const nextField = document.getElementById(nextFieldId);
        if (nextField) nextField.focus();
    }
};

/**
 * Saves the set when 'Enter' is pressed in the Weight input.
 */
globalThis.handleWeightEnter = (e, inputElement, exId, setNum, exName) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        inputElement.blur(); 
        const btn = document.getElementById(`btn-${exId}-${setNum}`);
        if (btn && !btn.disabled) {
            globalThis.saveSet(btn, exId, setNum, exName);
        }
    }
};

// Expose functions globally for dynamic HTML calls
globalThis.renderWorkout = renderWorkout;
globalThis.saveSet = saveSet;