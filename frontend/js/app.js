import { API } from './api.js';

window.state = {
    currentUserId: localStorage.getItem('selectedUserId'),
    currentUserName: localStorage.getItem('selectedUserName'),
    tempPin: ""
};

const API_URL = `http://${window.location.hostname}:5001`;

window.onload = () => {
    if (!window.state.currentUserId) {
        renderLandingPage();
    } else {
        renderDashboard();
    }
};

// --- LANDING PAGE & NAV ---

function renderLandingPage() {
    const nav = document.getElementById("main-nav");
    const container = document.getElementById("exercises");

    // Header buttons
    nav.innerHTML = `
        <button onclick="renderLoginScreen()" class="btn-nav btn-login">Login</button>
        <button onclick="renderSignUpScreen()" class="btn-nav btn-signup">Sign Up</button>
    `;

    // Hero Section
    container.innerHTML = `
        <div class="hero">
            <div style="font-size:80px; margin-bottom:20px;">💪</div>
            <h1>Gym Tracker</h1>
            <p>Your ultimate companion for strength and progress. Track every set, beat every record.</p>
            <div style="margin-top:40px;">
                <button onclick="renderSignUpScreen()" class="save-btn">Get Started for Free</button>
            </div>
        </div>
    `;
}

// --- AUTH SCREENS ---

window.renderLoginScreen = () => {
    document.getElementById("main-nav").innerHTML = `<button onclick="location.reload()" class="btn-nav btn-signup">← Back</button>`;
    document.getElementById("exercises").innerHTML = `
        <div style="text-align:center; margin-top:40px;">
            <h2>Welcome Back</h2>
            <p style="color:#8e8e93; margin-bottom:30px;">Enter your details to continue</p>
            <input type="text" id="login-name" placeholder="Username" oninput="showPinPad()">
            <div id="pin-area" style="display:none; margin-top:20px;">
                <div id="pin-display" style="font-size:30px; margin:20px 0; letter-spacing:10px; color:var(--primary);">○ ○ ○ ○</div>
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; max-width:250px; margin: 0 auto;">
                    ${[1,2,3,4,5,6,7,8,9,'C',0,'OK'].map(k => `
                        <button class="save-btn" style="background:#fff; color:#000; padding:15px; border-radius:50%; box-shadow:0 2px 5px rgba(0,0,0,0.1);" onclick="handlePinKey('${k}')">${k}</button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
};

window.renderSignUpScreen = () => {
    document.getElementById("main-nav").innerHTML = `<button onclick="location.reload()" class="btn-nav btn-signup">← Back</button>`;
    document.getElementById("exercises").innerHTML = `
        <div style="text-align:center; margin-top:40px;">
            <h2>Create Account</h2>
            <p style="color:#8e8e93; margin-bottom:30px;">Join our community (Max 5 users)</p>
            <input type="text" id="signup-name" placeholder="Choose Username">
            <input type="password" id="signup-pin" maxlength="4" inputmode="numeric" placeholder="Create 4-digit PIN">
            <div style="margin-top:20px;">
                <button onclick="handleSignUp()" class="save-btn">Create My Profile</button>
            </div>
        </div>
    `;
};

// --- LOGIC HANDLERS ---

window.showPinPad = () => {
    const name = document.getElementById("login-name").value;
    document.getElementById("pin-area").style.display = name.length >= 2 ? "block" : "none";
};

window.handlePinKey = (k) => {
    if (k === 'C') window.state.tempPin = "";
    else if (k === 'OK') {
        if (window.state.tempPin.length === 4) handleLogin(window.state.tempPin);
        else alert("Enter 4 digits");
        return;
    } else {
        if (window.state.tempPin.length < 4) window.state.tempPin += k;
    }
    const dots = "● ".repeat(window.state.tempPin.length) + "○ ".repeat(4 - window.state.tempPin.length);
    document.getElementById("pin-display").innerText = dots.trim();
};

window.handleLogin = async (pin) => {
    const name = document.getElementById("login-name").value;
    const res = await fetch(`http://${window.location.hostname}:5001/login`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({name, pin})
    });
    if (res.ok) {
        const data = await res.json();
        localStorage.setItem('selectedUserId', data.id);
        localStorage.setItem('selectedUserName', data.name);
        location.reload();
    } else {
        alert("Incorrect PIN");
        window.state.tempPin = "";
        document.getElementById("pin-display").innerText = "○ ○ ○ ○";
    }
};

window.handleSignUp = async () => {
    const name = document.getElementById("signup-name").value;
    const pin = document.getElementById("signup-pin").value;
    const res = await fetch(`http://${window.location.hostname}:5001/signup`, {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({name, pin})
    });
    if (res.ok) { alert("Account Created!"); location.reload(); }
    else alert("Limit reached or name taken");
};

// --- DASHBOARD ---

async function renderDashboard() {
    document.getElementById("main-nav").innerHTML = ""; // Usuń login/signup z góry
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
            <h2 style="margin:0">Hi, ${window.state.currentUserName}</h2>
            <div>
                <button onclick="renderSettings()" style="background:none; border:none; font-size:24px;">👤</button>
                <button onclick="logout()" class="nav-link" style="margin-left:10px;">Logout</button>
            </div>
        </div>
        <div id="plans-list"></div>
    `;
    const res = await fetch(`http://${window.location.hostname}:5001/plans/${window.state.currentUserId}`);
    const plans = await res.json();
    const list = document.getElementById("plans-list");
    plans.forEach(plan => {
        const btn = document.createElement("button");
        btn.className = "save-btn"; btn.style.marginBottom = "15px";
        btn.innerText = `Start: ${plan.name}`;
        btn.onclick = () => renderWorkout(plan.id, plan.name);
        list.appendChild(btn);
    });
}

// --- REMAINING FUNCTIONS (Settings, Workout, LogSet, Logout) ---
window.renderSettings = () => {
    document.getElementById("exercises").innerHTML = `
        <div style="padding: 20px;">
            <button onclick="location.reload()" class="nav-link">← Back</button>
            <h2 style="margin-top:20px;">Settings</h2>
            <div class="exercise-card">
                <h3>Change PIN</h3>
                <input type="password" id="old-pin" placeholder="Current PIN" style="margin-bottom:10px;">
                <input type="password" id="new-pin" maxlength="4" placeholder="New 4-digit PIN" style="margin-bottom:10px;">
                <input type="password" id="confirm-pin" maxlength="4" placeholder="Confirm New PIN" style="margin-bottom:15px;">
                <button onclick="updatePin()" class="save-btn">Update PIN</button>
            </div>
            <div class="exercise-card" style="margin-top:30px; border:1px solid red;">
                <h3 style="color:red; border-left-color:red;">Danger Zone</h3>
                <button onclick="deleteMyAccount()" class="save-btn" style="background:red;">Delete My Account</button>
            </div>
        </div>
    `;
};

window.updatePin = async () => {
    const oldPin = document.getElementById("old-pin").value;
    const newPin = document.getElementById("new-pin").value;
    const confirmPin = document.getElementById("confirm-pin").value;
    if (newPin !== confirmPin) return alert("PINs do not match");
    const res = await fetch(`http://${window.location.hostname}:5001/change-pin`, {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user_id: parseInt(window.state.currentUserId), old_pin: oldPin, new_pin: newPin})
    });
    if (res.ok) { alert("Success!"); location.reload(); }
    else alert("Incorrect current PIN");
};

window.deleteMyAccount = async () => {
    if (confirm("Delete everything?")) {
        await fetch(`http://${window.location.hostname}:5001/user/${window.state.currentUserId}`, { method: "DELETE" });
        logout();
    }
};

async function renderWorkout(planId, planName) {
    const container = document.getElementById("exercises");
    container.innerHTML = `<div style="display:flex; align-items:center; margin-bottom:25px"><button onclick="location.reload()" style="background:none; border:none; font-size:24px; margin-right:15px">←</button><h2 style="margin:0">${planName}</h2></div><div id='plan-content'></div>`;
    const res = await fetch(`http://${window.location.hostname}:5001/plan-exercises/${planId}`);
    const exercises = await res.json();
    const content = document.getElementById("plan-content");
    for (const ex of exercises) {
        const card = document.createElement("div"); card.className = "exercise-card";
        card.innerHTML = `<h3>${ex.name}</h3><div id="ex-${ex.id}"></div>`;
        content.appendChild(card);
        const list = document.getElementById(`ex-${ex.id}`);
        for (let i = 1; i <= ex.target_sets; i++) {
            const lRes = await fetch(`http://${window.location.hostname}:5001/last/${window.state.currentUserId}/${ex.id}/${i}`);
            const last = await lRes.json();
            const row = document.createElement("div"); row.className = "set-row";
            row.innerHTML = `<div style="font-weight:700; color:var(--primary)">S${i}</div><div><span class="label-small">Prev</span><span class="history-val" id="h-${ex.id}-${i}">${last.reps}x${last.weight}kg</span></div><div><span class="label-small">Reps</span><input type="number" inputmode="numeric" id="r-${ex.id}-${i}" placeholder="0"></div><div><span class="label-small">Kg</span><input type="number" inputmode="decimal" id="w-${ex.id}-${i}" placeholder="0"></div><div style="grid-column: span 4"><button class="save-btn" style="padding:10px; font-size:14px;" onclick="logSet(this, ${ex.id}, ${i})">Save Set ${i}</button></div>`;
            list.appendChild(row);
        }
    }
}

window.logSet = async (btn, exId, setNumber) => {
    const reps = parseInt(document.getElementById(`r-${exId}-${setNumber}`).value);
    const weight = parseFloat(document.getElementById(`w-${exId}-${setNumber}`).value.replace(',', '.'));
    if (isNaN(reps) || isNaN(weight)) return alert("Enter values");
    const res = await fetch(`http://${window.location.hostname}:5001/log`, {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user_id: parseInt(window.state.currentUserId), exercise_id: exId, set_number: setNumber, reps, weight})
    });
    if (res.ok) {
        document.getElementById(`h-${exId}-${setNumber}`).innerText = `${reps}x${weight}kg`;
        btn.innerText = "Saved ✓"; btn.style.background = "#34C759";
        setTimeout(() => { btn.innerText = `Save Set ${setNumber}`; btn.style.background = ""; }, 2000);
    }
};

window.logout = () => { localStorage.clear(); location.reload(); };