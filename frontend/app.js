/**
 * Gym Tracker Frontend Logic
 * Supports Multi-user with PIN authentication
 */

const API_URL = `http://${window.location.hostname}:5001`;
let currentUserId = localStorage.getItem('selectedUserId');
let currentUserName = localStorage.getItem('selectedUserName');

window.onload = () => {
    if (!currentUserId) {
        renderProfileSelection();
    } else {
        renderDashboard();
    }
};

// Clear session and refresh
function logout() {
    localStorage.clear();
    location.reload();
}

// Render User Profiles (No text, just buttons)
async function renderProfileSelection() {
    const container = document.getElementById("exercises");
    container.innerHTML = `<div id="profile-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:100px;"></div>`;
    
    const res = await fetch(`${API_URL}/users`);
    const users = await res.json();
    const grid = document.getElementById("profile-grid");

    users.forEach(user => {
        const card = document.createElement("div");
        card.className = "exercise-card";
        card.style.textAlign = "center";
        card.style.padding = "30px 10px";
        card.innerHTML = `<div style="font-size:40px; margin-bottom:10px;">👤</div><strong>${user.name}</strong>`;
        card.onclick = () => showPinPad(user.id, user.name);
        grid.appendChild(card);
    });
}

// Custom Pin Pad UI for iOS
function showPinPad(userId, userName) {
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="text-align:center; margin-top:50px;">
            <h2>Enter PIN for ${userName}</h2>
            <div id="pin-display" style="font-size:30px; letter-spacing:10px; margin:20px 0; height:40px;">_ _ _ _ _</div>
            <div id="keypad" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:15px; max-width:250px; margin: 0 auto;">
                ${[1,2,3,4,5,6,7,8,9, 'C', 0, 'OK'].map(key => `
                    <button class="save-btn" style="padding:20px; background:#fff; color:#000; border:1px solid #ddd;" onclick="handleKeyPress('${key}', ${userId}, '${userName}')">${key}</button>
                `).join('')}
            </div>
            <button class="nav-link" onclick="renderProfileSelection()" style="margin-top:30px;">Cancel</button>
        </div>
    `;
}

let enteredPin = "";
async function handleKeyPress(key, userId, userName) {
    if (key === 'C') {
        enteredPin = "";
    } else if (key === 'OK') {
        if (enteredPin.length !== 5) return alert("PIN must be 5 digits");
        
        const res = await fetch(`${API_URL}/verify-pin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, pin: enteredPin })
        });

        if (res.ok) {
            localStorage.setItem('selectedUserId', userId);
            localStorage.setItem('selectedUserName', userName);
            location.reload();
        } else {
            alert("Wrong PIN!");
            enteredPin = "";
        }
    } else {
        if (enteredPin.length < 5) enteredPin += key;
    }
    
    document.getElementById("pin-display").innerText = enteredPin.padEnd(5, "_").split("").join(" ");
}

// Render Dashboard with Workout Plans
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

// (The rest of the functions like renderWorkout and logSet would go here, 
// using English comments and the logic from previous versions)