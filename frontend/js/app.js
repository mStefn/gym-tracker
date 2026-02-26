import { API } from './api.js';

// Global State
window.state = {
    currentUserId: localStorage.getItem('selectedUserId'),
    currentUserName: localStorage.getItem('selectedUserName')
};

window.onload = () => {
    if (!window.state.currentUserId) {
        renderLoginScreen();
    } else {
        renderDashboard();
    }
};

// --- AUTH SCREENS ---

function renderLoginScreen() {
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="text-align:center; margin-top:80px; padding: 20px;">
            <div style="font-size:60px; margin-bottom:20px;">🏋️‍♂️</div>
            <h1 style="margin-bottom:30px;">Gym Tracker</h1>
            
            <input type="text" id="login-name" placeholder="Username" style="margin-bottom:15px; text-align:left; padding-left:15px;">
            <input type="password" id="login-pin" inputmode="numeric" maxlength="4" placeholder="4-digit PIN" style="margin-bottom:25px;">
            
            <button onclick="handleLogin()" class="save-btn" style="margin-bottom:15px;">Login</button>
            <button onclick="renderSignUpScreen()" class="nav-link">Create Account</button>
        </div>
    `;
}

window.renderSignUpScreen = () => {
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="text-align:center; margin-top:80px; padding: 20px;">
            <h2>Join Gym Tracker</h2>
            <p style="color:#8e8e93; margin-bottom:30px;">Set a name and a 4-digit PIN</p>
            
            <input type="text" id="signup-name" placeholder="Username" style="margin-bottom:15px; text-align:left; padding-left:15px;">
            <input type="password" id="signup-pin" inputmode="numeric" maxlength="4" placeholder="4-digit PIN" style="margin-bottom:25px;">
            
            <button onclick="handleSignUp()" class="save-btn" style="margin-bottom:15px;">Sign Up</button>
            <button onclick="location.reload()" class="nav-link">Back to Login</button>
        </div>
    `;
};

// --- AUTH HANDLERS ---

window.handleLogin = async () => {
    const name = document.getElementById("login-name").value;
    const pin = document.getElementById("login-pin").value;

    const auth = await API.login(name, pin);
    if (auth.ok) {
        localStorage.setItem('selectedUserId', auth.data.id);
        localStorage.setItem('selectedUserName', auth.data.name);
        location.reload();
    } else {
        alert(auth.data.error || "Invalid username or PIN");
    }
};

window.handleSignUp = async () => {
    const name = document.getElementById("signup-name").value;
    const pin = document.getElementById("signup-pin").value;

    if (name.length < 2 || pin.length !== 4) {
        return alert("Name too short or PIN not 4 digits");
    }

    const auth = await API.signup(name, pin);
    if (auth.ok) {
        alert("Account created! You can now login.");
        location.reload();
    } else {
        alert(auth.data.error || "Could not create account");
    }
};

// --- DASHBOARD & WORKOUT ---

async function renderDashboard() {
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
            <h2 style="margin:0">Hi, ${window.state.currentUserName}</h2>
            <button onclick="logout()" class="nav-link">Logout</button>
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
    } catch (e) { console.error(e); }
}

async function renderWorkout(planId, planName) {
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="display:flex; align-items:center; margin-bottom:25px">
            <button onclick="location.reload()" style="background:none; border:none; font-size:24px; margin-right:15px">←</button>
            <h2 style="margin:0">${planName}</h2>
        </div>
        <div id='plan-content'></div>
    `;
    
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
}

window.logSet = async (btn, exId, setNumber) => {
    const reps = parseInt(document.getElementById(`r-${exId}-${setNumber}`).value);
    const weight = parseFloat(document.getElementById(`w-${exId}-${setNumber}`).value.replace(',', '.'));

    if (isNaN(reps) || isNaN(weight)) return alert("Enter values");

    const res = await API.logSet({
        user_id: parseInt(window.state.currentUserId),
        exercise_id: exId,
        set_number: setNumber,
        reps,
        weight
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