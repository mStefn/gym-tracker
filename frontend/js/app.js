import { API } from './api.js';

// Global State
window.state = {
    currentUserId: localStorage.getItem('selectedUserId'),
    currentUserName: localStorage.getItem('selectedUserName'),
    enteredPin: ""
};

// --- ENTRY POINT ---
window.onload = () => {
    if (!window.state.currentUserId) {
        renderProfileSelection();
    } else {
        renderDashboard();
    }
};

// --- AUTH / PROFILE SELECTION ---
async function renderProfileSelection() {
    const container = document.getElementById("exercises");
    container.innerHTML = `<div id="profile-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:100px;"></div>`;
    
    try {
        const users = await API.fetchUsers();
        const grid = document.getElementById("profile-grid");

        users.forEach(user => {
            const card = document.createElement("div");
            card.className = "exercise-card";
            card.style.textAlign = "center";
            card.style.cursor = "pointer";
            card.innerHTML = `
                <div style="font-size:40px; margin-bottom:10px;">👤</div>
                <strong>${user.name}</strong><br>
                <small style="color:#8e8e93">${user.has_pin ? 'Locked' : 'No PIN set'}</small>
            `;
            card.onclick = () => window.showPinPad(user.id, user.name, user.has_pin);
            grid.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = `<p style="color:red; text-align:center;">API Connection Failed</p>`;
    }
}

// --- PIN PAD LOGIC (Exposed to Window) ---
window.showPinPad = (userId, userName, hasPin) => {
    window.state.enteredPin = "";
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="text-align:center; margin-top:50px;">
            <h2 style="margin-bottom:5px;">${hasPin ? 'Enter PIN' : 'Create PIN'}</h2>
            <p style="color:#8e8e93; margin-top:0;">User: ${userName}</p>
            <div id="pin-display" style="font-size:40px; margin:30px 0; letter-spacing:15px; color:var(--primary);">○ ○ ○ ○</div>
            <div id="keypad" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:15px; max-width:280px; margin: 0 auto;">
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(key => `
                    <button class="save-btn" 
                            style="padding:20px; background:#fff; color:#000; border-radius:50%; width:70px; height:70px; margin:0 auto; box-shadow: 0 2px 5px rgba(0,0,0,0.1);" 
                            onclick="handleKeyPress('${key}', ${userId}, '${userName}')">
                        ${key}
                    </button>
                `).join('')}
            </div>
            <button class="nav-link" onclick="location.reload()" style="margin-top:40px;">Cancel</button>
        </div>
    `;
};

window.handleKeyPress = async (key, userId, userName) => {
    const display = document.getElementById("pin-display");

    if (key === 'C') {
        window.state.enteredPin = "";
    } else if (key === 'OK') {
        if (window.state.enteredPin.length !== 4) return alert("PIN must be 4 digits");
        
        const auth = await API.auth(userId, window.state.enteredPin);

        if (auth.ok) {
            localStorage.setItem('selectedUserId', userId);
            localStorage.setItem('selectedUserName', userName);
            location.reload();
        } else {
            alert("Incorrect PIN!");
            window.state.enteredPin = "";
        }
    } else {
        if (window.state.enteredPin.length < 4) window.state.enteredPin += key;
    }
    
    let dots = "";
    for (let i = 0; i < 4; i++) {
        dots += (i < window.state.enteredPin.length) ? "● " : "○ ";
    }
    if(display) display.innerText = dots.trim();
};

// --- DASHBOARD ---
async function renderDashboard() {
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
            <h2 style="margin:0">Hi, ${window.state.currentUserName}</h2>
            <button onclick="logout()" class="nav-link">Switch Profile</button>
        </div>
        <div id="plans-list"></div>
    `;

    try {
        const plans = await API.fetchPlans(window.state.currentUserId);
        const list = document.getElementById("plans-list");

        plans.forEach(plan => {
            const btn = document.createElement("button");
            btn.className = "save-btn";
            btn.style.marginBottom = "15px";
            btn.innerText = `Start: ${plan.name}`;
            btn.onclick = () => renderWorkout(plan.id, plan.name);
            list.appendChild(btn);
        });
    } catch (e) {
        console.error("Dashboard error:", e);
    }
}

// --- WORKOUT VIEW ---
async function renderWorkout(planId, planName) {
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="display:flex; align-items:center; margin-bottom:25px">
            <button onclick="location.reload()" style="background:none; border:none; font-size:24px; margin-right:15px">←</button>
            <h2 style="margin:0">${planName}</h2>
        </div>
        <div id='plan-content'></div>
    `;
    
    try {
        const exercises = await API.fetchPlanExercises(planId);
        const content = document.getElementById("plan-content");

        for (const ex of exercises) {
            const card = document.createElement("div");
            card.className = "exercise-card";
            card.innerHTML = `<h3>${ex.name}</h3><div id="ex-${ex.id}"></div>`;
            content.appendChild(card);
            
            const list = document.getElementById(`ex-${ex.id}`);
            for (let i = 1; i <= ex.sets; i++) {
                const last = await API.fetchLastResult(window.state.currentUserId, ex.id, i);
                
                const row = document.createElement("div");
                row.className = "set-row";
                row.innerHTML = `
                    <div style="font-weight:700; color:var(--primary)">S${i}</div>
                    <div><span class="label-small">Prev</span><span class="history-val" id="h-${ex.id}-${i}">${last.reps}x${last.weight}kg</span></div>
                    <div><span class="label-small">Reps</span><input type="number" inputmode="numeric" id="r-${ex.id}-${i}" placeholder="0"></div>
                    <div><span class="label-small">Kg</span><input type="number" inputmode="decimal" id="w-${ex.id}-${i}" placeholder="0"></div>
                    <div style="grid-column: span 4"><button class="save-btn" style="padding:10px; font-size:14px;" onclick="logSet(this, ${ex.id}, ${i})">Save Set ${i}</button></div>
                `;
                list.appendChild(row);
            }
        }
    } catch (e) {
        console.error("Workout error:", e);
    }
}

// --- ACTIONS ---
window.logSet = async (btn, exId, setNumber) => {
    const repsInput = document.getElementById(`r-${exId}-${setNumber}`);
    const weightInput = document.getElementById(`w-${exId}-${setNumber}`);
    
    const reps = parseInt(repsInput.value);
    const weight = parseFloat(weightInput.value.replace(',', '.'));

    if (isNaN(reps) || isNaN(weight)) return alert("Enter values");

    const res = await API.logSet({
        user_id: parseInt(window.state.currentUserId),
        exercise_id: exId,
        set_number: setNumber,
        reps: reps,
        weight: weight
    });

    if (res.ok) {
        document.getElementById(`h-${exId}-${setNumber}`).innerText = `${reps}x${weight}kg`;
        btn.innerText = "Saved ✓";
        btn.style.background = "var(--success)";
        setTimeout(() => { btn.innerText = `Save Set ${setNumber}`; btn.style.background = ""; }, 2000);
    }
};

window.logout = () => {
    localStorage.clear();
    location.reload();
};