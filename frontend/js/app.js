import { API } from './api.js';

window.state = {
    currentUserId: localStorage.getItem('selectedUserId'),
    currentUserName: localStorage.getItem('selectedUserName'),
    isAdmin: localStorage.getItem('isAdmin') === 'true'
};

window.onload = () => {
    if (!window.state.currentUserId) renderLoginScreen();
    else renderDashboard();
};

function renderLoginScreen() {
    document.getElementById("exercises").innerHTML = `
        <div style="text-align:center; margin-top:80px; padding: 20px;">
            <div style="font-size:60px; margin-bottom:20px;">🏋️‍♂️</div>
            <h1>Gym Tracker</h1>
            <input type="text" id="login-name" placeholder="Username" style="margin-bottom:15px;">
            <input type="password" id="login-pin" placeholder="PIN / Password" style="margin-bottom:25px;">
            <button onclick="handleLogin()" class="save-btn" style="margin-bottom:15px;">Login</button>
            <button onclick="renderSignUpScreen()" class="nav-link">Create Account</button>
        </div>
    `;
}

window.handleLogin = async () => {
    const name = document.getElementById("login-name").value;
    const pin = document.getElementById("login-pin").value;
    const auth = await API.login(name, pin);
    if (auth.ok) {
        localStorage.setItem('selectedUserId', auth.data.id);
        localStorage.setItem('selectedUserName', auth.data.name);
        localStorage.setItem('isAdmin', auth.data.is_admin);
        location.reload();
    } else alert("Invalid credentials");
};

window.renderSignUpScreen = () => {
    document.getElementById("exercises").innerHTML = `
        <div style="text-align:center; margin-top:80px; padding: 20px;">
            <h2>Sign Up</h2>
            <input type="text" id="signup-name" placeholder="Username" style="margin-bottom:15px;">
            <input type="password" id="signup-pin" maxlength="4" placeholder="4-digit PIN" style="margin-bottom:25px;">
            <button onclick="handleSignUp()" class="save-btn" style="margin-bottom:15px;">Sign Up</button>
            <button onclick="location.reload()" class="nav-link">Back</button>
        </div>
    `;
};

window.handleSignUp = async () => {
    const name = document.getElementById("signup-name").value;
    const pin = document.getElementById("signup-pin").value;
    const res = await API.signup(name, pin);
    if (res.ok) { alert("Created! Now login."); location.reload(); }
    else alert("Error creating account");
};

async function renderDashboard() {
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
            <h2 style="margin:0">Hi, ${window.state.currentUserName}</h2>
            <div>
                ${window.state.isAdmin ? '<button onclick="renderAdminPanel()" style="background:none; border:none; font-size:20px; margin-right:15px;">⚙️</button>' : ''}
                <button onclick="renderSettings()" style="background:none; border:none; font-size:20px; margin-right:15px;">👤</button>
                <button onclick="logout()" class="nav-link">Logout</button>
            </div>
        </div>
        <div id="plans-list"></div>
    `;
    const plans = await API.fetchPlans(window.state.currentUserId);
    const list = document.getElementById("plans-list");
    plans.forEach(plan => {
        const btn = document.createElement("button");
        btn.className = "save-btn"; btn.style.marginBottom = "15px";
        btn.innerText = `Start: ${plan.name}`;
        btn.onclick = () => renderWorkout(plan.id, plan.name);
        list.appendChild(btn);
    });
}

window.renderSettings = () => {
    document.getElementById("exercises").innerHTML = `
        <div style="padding: 20px;">
            <button onclick="location.reload()" class="nav-link">← Back</button>
            <h2 style="margin-top:20px;">Account Settings</h2>
            <div class="exercise-card">
                <h3>Change PIN</h3>
                <input type="password" id="new-pin" maxlength="4" placeholder="New 4-digit PIN" style="margin-bottom:10px;">
                <button onclick="updatePin()" class="save-btn">Update PIN</button>
            </div>
            <div class="exercise-card" style="margin-top:40px; border: 1px solid red;">
                <h3 style="color:red; border-left-color:red;">Danger Zone</h3>
                <button onclick="deleteMyAccount()" class="save-btn" style="background:red;">Delete My Account</button>
            </div>
        </div>
    `;
};

window.updatePin = async () => {
    const pin = document.getElementById("new-pin").value;
    if(pin.length !== 4) return alert("PIN must be 4 digits");
    await fetch(`http://${window.location.hostname}:5001/change-pin`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user_id: parseInt(window.state.currentUserId), new_pin: pin})
    });
    alert("PIN Updated!");
};

window.deleteMyAccount = async () => {
    if(confirm("Are you sure? All your data will be gone forever!")) {
        await fetch(`http://${window.location.hostname}:5001/user/${window.state.currentUserId}`, { method: "DELETE" });
        logout();
    }
};

window.renderAdminPanel = async () => {
    const res = await fetch(`http://${window.location.hostname}:5001/admin/users`);
    const users = await res.json();
    document.getElementById("exercises").innerHTML = `
        <div style="padding: 20px;">
            <button onclick="location.reload()" class="nav-link">← Back</button>
            <h2 style="margin-top:20px;">Admin Panel</h2>
            <p>Total users: ${users.length} / 6 (including admin)</p>
            ${users.map(u => `
                <div class="exercise-card" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>${u.name} ${u.is_admin ? '(Admin)' : ''}</span>
                    ${!u.is_admin ? `<button onclick="adminDeleteUser(${u.id})" style="background:red; color:white; border:none; padding:5px 10px; border-radius:5px;">Delete</button>` : ''}
                </div>
            `).join('')}
        </div>
    `;
};

window.adminDeleteUser = async (id) => {
    if(confirm("Delete this user?")) {
        await fetch(`http://${window.location.hostname}:5001/user/${id}`, { method: "DELETE" });
        renderAdminPanel();
    }
};

// ... workout and log functions from previous version ...
window.logout = () => { localStorage.clear(); location.reload(); };

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