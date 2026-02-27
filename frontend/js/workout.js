import { state, API_URL } from './state.js';

window.renderWorkout = async (planId, planName) => {
    const container = document.getElementById("exercises");
    container.innerHTML = `<div style="display:flex; align-items:center; margin-bottom:25px"><button onclick="location.reload()" style="background:none; border:none; font-size:24px; margin-right:15px">←</button><h2 style="margin:0">${planName}</h2></div><div id='plan-content'></div>`;
    
    const res = await fetch(`${API_URL}/plan-exercises/${planId}`);
    const exercises = await res.json();
    const content = document.getElementById("plan-content");

    for (const ex of exercises) {
        const card = document.createElement("div"); card.className = "exercise-card";
        card.innerHTML = `<h3>${ex.name}</h3><div id="ex-${ex.id}"></div>`;
        content.appendChild(card);
        const list = document.getElementById(`ex-${ex.id}`);
        for (let i = 1; i <= ex.sets; i++) {
            const lRes = await fetch(`${API_URL}/last/${state.currentUserId}/${ex.id}/${i}`);
            const last = await lRes.json();
            const row = document.createElement("div"); row.className = "set-row";
            row.innerHTML = `<div style="font-weight:700; color:var(--primary)">S${i}</div>
                <div><span class="label-small">Prev</span><span class="history-val">${last.reps}x${last.weight}kg</span></div>
                <div><span class="label-small">Reps</span><input type="number" id="r-${ex.id}-${i}" placeholder="0"></div>
                <div><span class="label-small">Kg</span><input type="number" id="w-${ex.id}-${i}" placeholder="0"></div>
                <div style="grid-column: span 4"><button class="save-btn" style="padding:10px; font-size:14px;" onclick="logSet(this, ${ex.id}, ${i})">Save</button></div>`;
            list.appendChild(row);
        }
    }
};

window.logSet = async (btn, exId, setNumber) => {
    const reps = parseInt(document.getElementById(`r-${exId}-${setNumber}`).value);
    const weight = parseFloat(document.getElementById(`w-${exId}-${setNumber}`).value);
    if (isNaN(reps) || isNaN(weight)) return alert("Enter values");
    const res = await fetch(`${API_URL}/log`, {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user_id: parseInt(state.currentUserId), exercise_id: exId, set_number: setNumber, reps, weight})
    });
    if (res.ok) { btn.innerText = "Saved ✓"; btn.style.background = "#34C759"; }
};