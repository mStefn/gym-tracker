import { state, API_URL } from './state.js';

export function renderAuthScreen(mode) {
    state.mode = mode;
    state.tempPin = "";

    document.getElementById("exercises").innerHTML = `
        <div class="auth-wrapper">
            <div style="background: var(--card-bg); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); padding: 40px 30px; border-radius: 24px; border: 1px solid var(--border); text-align: center; max-width: 380px; width: 90%; box-shadow: 0 15px 50px rgba(0,0,0,0.8); position: relative;">
                
                <button onclick="location.reload()" style="position: absolute; top: 20px; left: 20px; background: transparent; border: none; color: var(--primary); font-size: 14px; font-weight: 600; cursor: pointer;">← Back</button>
                
                <h2 style="font-size: 22px; margin: 0 0 25px 0; color: var(--text); text-transform: uppercase; letter-spacing: 1px;">
                    ${mode === 'login' ? 'LOGIN' : 'SIGN UP'}
                </h2>
                
                <input type="text" id="auth-name" placeholder="Username" style="margin-bottom:15px; text-align: center; font-size: 18px; text-transform: uppercase;">
                
                <div id="pin-area">
                    <div id="pin-display" style="font-size:34px; margin:10px 0 25px 0; letter-spacing:12px; color:var(--primary); text-shadow: 0 0 10px var(--primary-glow);">○ ○ ○ ○</div>
                    
                    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:15px; max-width:260px; margin: 0 auto;">
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(k => {
                            let extraClass = '';
                            if (k === 'C') extraClass = 'action-c';
                            if (k === 'OK') extraClass = 'action-ok';
                            return `<button class="pin-btn ${extraClass}" onclick="handlePinKey('${k}')">${k}</button>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.handlePinKey = (k) => {
    if (k === 'C') {
        state.tempPin = "";
    } else if (k === 'OK') {
        if (state.tempPin.length === 4) {
            state.mode === 'login' ? handleLogin(state.tempPin) : handleSignUp(state.tempPin);
        } else {
            alert("Please enter a 4-digit PIN");
        }
        return;
    } else {
        if (state.tempPin.length < 4) state.tempPin += k;
    }
    document.getElementById("pin-display").innerText = ("● ".repeat(state.tempPin.length) + "○ ".repeat(4 - state.tempPin.length)).trim();
};

async function handleLogin(pin) {
    const name = document.getElementById("auth-name").value.trim();
    if (!name) return alert("Please enter your username");

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST", headers: {"Content-Type":"application/json"},
            body: JSON.stringify({name, pin})
        });
        
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('selectedUserId', data.id);
            localStorage.setItem('selectedUserName', data.name);
            localStorage.setItem('authToken', data.token);
            location.reload(); 
        } else {
            alert("Invalid username or PIN");
            state.tempPin = "";
            document.getElementById("pin-display").innerText = "○ ○ ○ ○";
        }
    } catch (e) {
        alert("Server connection error. Please try again.");
    }
}

async function handleSignUp(pin) {
    const name = document.getElementById("auth-name").value.trim();
    if (!name) return alert("Please enter a username");

    try {
        const res = await fetch(`${API_URL}/signup`, {
            method: "POST", headers: {"Content-Type":"application/json"},
            body: JSON.stringify({name, pin})
        });
        
        if (res.ok) { 
            alert("Account created successfully! Please log in."); 
            location.reload(); 
        } else {
            alert("Error: Username might be taken.");
        }
    } catch (e) {
        alert("Server connection error. Please try again.");
    }
}