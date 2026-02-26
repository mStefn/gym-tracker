const API_URL = `http://${window.location.hostname}:5001`;
let currentUserId = localStorage.getItem('selectedUserId');
let currentUserName = localStorage.getItem('selectedUserName');
let enteredPin = "";

window.onload = () => {
    if (!currentUserId) {
        renderProfileSelection();
    } else {
        renderDashboard();
    }
};

function logout() {
    localStorage.clear();
    location.reload();
}

async function renderProfileSelection() {
    const container = document.getElementById("exercises");
    container.innerHTML = `<div id="profile-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:100px;"></div>`;
    
    try {
        const res = await fetch(`${API_URL}/users`);
        const users = await res.json();
        const grid = document.getElementById("profile-grid");

        users.forEach(user => {
            const card = document.createElement("div");
            card.className = "exercise-card";
            card.style.textAlign = "center";
            card.style.padding = "30px 10px";
            card.innerHTML = `<div style="font-size:40px; margin-bottom:10px;">👤</div><strong>${user.name}</strong><br>
                              <small style="color:#8e8e93">${user.has_pin ? 'Locked' : 'No PIN set'}</small>`;
            card.onclick = () => showPinPad(user.id, user.name, user.has_pin);
            grid.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = `<p style="text-align:center; color:red; margin-top:50px;">Connection Error</p>`;
    }
}

function showPinPad(userId, userName, hasPin) {
    enteredPin = "";
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="text-align:center; margin-top:50px;">
            <h2 style="margin-bottom:5px;">${hasPin ? 'Enter PIN' : 'Create PIN'}</h2>
            <p style="color:#8e8e93; margin-top:0;">Account: ${userName}</p>
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
}

async function handleKeyPress(key, userId, userName) {
    if (key === 'C') {
        enteredPin = "";
    } else if (key === 'OK') {
        if (enteredPin.length !== 4) return alert("PIN must be 4 digits");
        
        const res = await fetch(`${API_URL}/auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, pin: enteredPin })
        });

        const data = await res.json();

        if (res.ok) {
            if (data.status === 'pin_established') alert("PIN successfully set!");
            localStorage.setItem('selectedUserId', userId);
            localStorage.setItem('selectedUserName', userName);
            location.reload();
        } else {
            alert("Wrong PIN!");
            enteredPin = "";
        }
    } else {
        if (enteredPin.length < 4) enteredPin += key;
    }
    
    updateDots();
}

function updateDots() {
    let dots = "";
    for (let i = 0; i < 4; i++) {
        dots += (i < enteredPin.length) ? "● " : "○ ";
    }
    document.getElementById("pin-display").innerText = dots.trim();
}

async function renderDashboard() {
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
            <h2 style="margin:0">Hi, ${currentUserName}</h2>
            <button onclick="logout()" class="nav-link">Switch Profile</button>
        </div>
        <div id="plans-list"></div>
    `;

    const res = await fetch(`${API_URL}/plans/${currentUserId}`);
    const plans = await res.json();
    const list = document.getElementById("plans-list");

    plans.forEach(plan => {
        const btn = document.createElement("button");
        btn.className = "save-btn";
        btn.style.marginBottom = "15px";
        btn.innerText = `Start: ${plan.name}`;
        btn.onclick = () => renderWorkout(plan.id, plan.name);
        list.appendChild(btn);
    });
}

async function renderWorkout(planId, planName) {
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="display:flex; align-items:center; margin-bottom:25px">
            <button onclick="renderDashboard()" style="background:none; border:none; font-size:24px; margin-right:15px">←</button>
            <h2 style="margin:0">${planName}</h2>
        </div>
        <div id='plan-content'></div>
    `;
    
    const res = await fetch(`${API_URL}/plan-exercises/${planId}`);
    const exercises = await res.json();
    const content = document.getElementById("plan-content");

    for (const ex of exercises) {
        const card = document.createElement("div");
        card.className = "exercise-card";
        card.innerHTML = `<h3>${ex.name}</h3><div id="ex-${ex.id}"></div>`;
        content.appendChild(card);
        
        const list = document.getElementById(`ex-${ex.id}`);
        for (let i = 1; i <= ex.sets; i++) {
            const lastRes = await fetch(`${API_URL}/last/${currentUserId}/${ex.id}/${i}`);
            const last = await lastRes.json();
            
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
}

async function logSet(btn, exId, setNumber) {
    const reps = parseInt(document.getElementById(`r-${exId}-${setNumber}`).value);
    const weight = parseFloat(document.getElementById(`w-${exId}-${setNumber}`).value.replace(',', '.'));

    if (isNaN(reps) || isNaN(weight)) return alert("Enter values");

    const res = await fetch(`${API_URL}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: parseInt(currentUserId), exercise_id: exId, set_number: setNumber, reps, weight })
    });

    if (res.ok) {
        document.getElementById(`h-${exId}-${setNumber}`).innerText = `${reps}x${weight}kg`;
        btn.innerText = "Saved ✓";
        btn.style.background = "#34C759";
        setTimeout(() => { btn.innerText = `Save Set ${setNumber}`; btn.style.background = ""; }, 2000);
    }
}