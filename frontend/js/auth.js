import { state, API_URL } from './state.js';

export function renderAuthScreen(mode) {
    state.mode = mode;
    state.tempPin = "";
    const isLogin = mode === 'login';

    // Wszystko renderujemy teraz wewnątrz jedynego głównego kontenera #exercises
    document.getElementById("exercises").innerHTML = `
        <div style="max-width: 400px; margin: 0 auto; padding-top: 20px;">
            <button onclick="location.reload()" style="background: transparent; border: none; color: var(--primary); padding: 0; margin-bottom: 20px; font-size: 16px; font-weight: 600; cursor: pointer;">← Back</button>
            
            <div style="text-align:center;">
                <h2 style="font-size: 28px; margin-bottom: 5px;">${isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p style="color:#8e8e93; margin-bottom:30px; font-size: 16px;">${isLogin ? 'Enter your details to log in' : 'Join us and track your progress'}</p>
                
                <input type="text" id="auth-name" placeholder="Username" style="margin-bottom:20px; text-align: center; font-size: 18px;">
                
                <div id="pin-area">
                    <div id="pin-display" style="font-size:30px; margin:20px 0; letter-spacing:10px; color:var(--primary);">○ ○ ○ ○</div>
                    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:15px; max-width:280px; margin: 0 auto;">
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(k => {
                            const isAction = k === 'C' || k === 'OK';
                            const bgColor = isAction ? 'var(--card-bg)' : '#ffffff';
                            const color = k === 'C' ? 'var(--danger)' : (k === 'OK' ? 'var(--success)' : 'var(--text)');
                            const weight = isAction ? '700' : '500';
                            return `
                            <button style="background:${bgColor}; color:${color}; padding:0; border:1px solid var(--border); border-radius:50%; box-shadow:0 2px 8px rgba(0,0,0,0.05); cursor:pointer; font-size:22px; font-weight:${weight}; display:flex; align-items:center; justify-content:center; aspect-ratio: 1;" 
                            onclick="handlePinKey('${k}')">${k}</button>
                        `}).join('')}
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
            location.reload(); // Przeładowanie uruchomi nową strukturę z app.js
        } else {
            alert("Invalid username or PIN");
            // Resetujemy PIN na ekranie po błędnym wpisaniu
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