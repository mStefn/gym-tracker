import { state, API_URL } from './state.js';

export function renderAuthScreen(mode) {
    state.mode = mode;
    state.tempPin = "";
    const isLogin = mode === 'login';

    document.getElementById("main-nav").innerHTML = `<button onclick="location.reload()" class="btn-nav btn-signup">← Back</button>`;
    document.getElementById("exercises").innerHTML = `
        <div style="text-align:center; margin-top:40px;">
            <h2>${isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p style="color:#8e8e93; margin-bottom:30px;">${isLogin ? 'Login' : 'Join us'}</p>
            <input type="text" id="auth-name" placeholder="Username" style="margin-bottom:20px;">
            <div id="pin-area">
                <div id="pin-display" style="font-size:30px; margin:20px 0; letter-spacing:10px; color:var(--primary);">○ ○ ○ ○</div>
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; max-width:250px; margin: 0 auto;">
                    ${[1,2,3,4,5,6,7,8,9,'C',0,'OK'].map(k => `
                        <button class="save-btn" style="background:#fff; color:#000; padding:15px; border-radius:50%; shadow:0 2px 5px rgba(0,0,0,0.1);" 
                        onclick="handlePinKey('${k}')">${k}</button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

window.handlePinKey = (k) => {
    if (k === 'C') state.tempPin = "";
    else if (k === 'OK') {
        if (state.tempPin.length === 4) {
            state.mode === 'login' ? handleLogin(state.tempPin) : handleSignUp(state.tempPin);
        } else alert("Enter 4 digits");
        return;
    } else {
        if (state.tempPin.length < 4) state.tempPin += k;
    }
    document.getElementById("pin-display").innerText = ("● ".repeat(state.tempPin.length) + "○ ".repeat(4 - state.tempPin.length)).trim();
};

async function handleLogin(pin) {
    const name = document.getElementById("auth-name").value;
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
    } else alert("Invalid credentials");
}

async function handleSignUp(pin) {
    const name = document.getElementById("auth-name").value;
    const res = await fetch(`${API_URL}/signup`, {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({name, pin})
    });
    if (res.ok) { alert("Created! Login now."); location.reload(); }
    else alert("Error: Limit reached or name taken");
}