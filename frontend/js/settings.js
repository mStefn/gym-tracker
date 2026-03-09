import { state, API_URL, authFetch, logout } from './state.js';

export function renderSettings() {
    const container = document.getElementById("exercises");
    
    // Sprawdzanie statusu PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    
    let installBtnHtml = '';
    if (!isStandalone) {
        installBtnHtml = `
            <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin-bottom: 20px; text-align: center;">
                <h3 style="margin-top: 0; margin-bottom: 10px;">Install App</h3>
                <p style="color: #8e8e93; font-size: 14px; margin-bottom: 20px;">Install Gym Tracker on your home screen for a better, full-screen experience.</p>
                <button id="install-btn" class="save-btn" style="background: var(--primary); color: #000;">📲 Install App</button>
            </div>
        `;
    }

    container.innerHTML = `
        <div style="padding-bottom: 30px;">
            <button onclick="window.navigate('home')" style="background: transparent; border: none; color: var(--primary); padding: 0; margin-bottom: 20px; font-size: 16px; font-weight: 600; cursor: pointer;">← Back</button>
            <h2 style="margin-top: 0; margin-bottom: 20px;">Settings</h2>
            
            <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 15px;">Account</h3>
                <p style="color: #8e8e93; font-size: 14px; margin-bottom: 25px;">Logged in as: <strong style="color: var(--text);">${state.currentUserName}</strong></p>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button onclick="window.openPinModal()" class="save-btn" style="background: rgba(255, 255, 255, 0.05); color: var(--text); border: 1px solid var(--border); box-shadow: none; font-size: 15px;">🔑 Change PIN</button>
                    <button onclick="window.triggerClearHistory()" class="save-btn" style="background: rgba(255, 149, 0, 0.1); color: var(--success); border: 1px solid rgba(255, 149, 0, 0.3); box-shadow: none; font-size: 15px;">🗑️ Clear Workout History</button>
                    <button onclick="window.triggerDeleteAccount()" class="save-btn" style="background: rgba(255, 59, 48, 0.1); color: var(--danger); border: 1px solid rgba(255, 59, 48, 0.3); box-shadow: none; font-size: 15px;">⚠️ Delete Account</button>
                </div>
            </div>

            ${installBtnHtml}

            <div style="margin-top: 30px;">
                <button onclick="window.appLogout()" class="save-btn" style="background: transparent; color: var(--danger); border: 1px solid var(--danger); box-shadow: none;">Logout</button>
            </div>
        </div>
    `;

    // Obsługa instalacji PWA
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (navigator.vibrate) navigator.vibrate(10);
            if (window.deferredPrompt) {
                window.deferredPrompt.prompt();
                const { outcome } = await window.deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    window.deferredPrompt = null;
                    installBtn.style.display = 'none'; 
                }
            } else {
                alert("To install, open browser menu and select 'Add to Home Screen'.");
            }
        });
    }
}

// ==========================================
// KLAWIATURA PIN DO ZMIANY HASŁA
// ==========================================
let oldPin = "";
let newPin = "";
let pinMode = "old"; 

window.openPinModal = () => {
    oldPin = "";
    newPin = "";
    pinMode = "old";

    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.id = "pin-modal";
    
    modal.innerHTML = `
        <div class="modal-content" style="height: auto; max-height: 90%; padding: 40px 30px; align-items: center; border-radius: 24px; text-align: center; max-width: 380px;">
            <button onclick="window.closePinModal()" style="position: absolute; top: 15px; right: 20px; background: none; border: none; color: #8e8e93; font-size: 28px; cursor: pointer;">&times;</button>
            
            <h2 id="pin-title" style="font-size: 22px; margin: 0 0 10px 0; color: var(--text); text-transform: uppercase; letter-spacing: 1px;">
                ENTER OLD PIN
            </h2>
            
            <div id="pin-area">
                <div id="pin-display" style="font-size: 34px; margin: 10px 0 25px 0; letter-spacing: 12px; color: var(--primary); text-shadow: 0 0 10px var(--primary-glow);">○ ○ ○ ○</div>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; max-width: 260px; margin: 0 auto;">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(k => {
                        let extraClass = '';
                        if (k === 'C') extraClass = 'action-c';
                        if (k === 'OK') extraClass = 'action-ok';
                        return `<button class="pin-btn ${extraClass}" onclick="window.handleSettingsPinKey('${k}')">${k}</button>`;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.closePinModal = () => {
    const modal = document.getElementById("pin-modal");
    if (modal) modal.remove();
};

window.handleSettingsPinKey = (k) => {
    if (navigator.vibrate) navigator.vibrate(10);
    
    let currentPin = pinMode === 'old' ? oldPin : newPin;

    if (k === 'C') {
        currentPin = "";
    } else if (k === 'OK') {
        if (currentPin.length === 4) {
            if (pinMode === 'old') {
                oldPin = currentPin;
                pinMode = 'new';
                document.getElementById("pin-title").innerText = "ENTER NEW PIN";
                currentPin = "";
            } else {
                newPin = currentPin;
                window.submitPinChange();
                return;
            }
        } else {
            alert("Please enter a 4-digit PIN");
            return;
        }
    } else {
        if (currentPin.length < 4) currentPin += k;
    }

    if (pinMode === 'old') oldPin = currentPin;
    else newPin = currentPin;

    document.getElementById("pin-display").innerText = ("● ".repeat(currentPin.length) + "○ ".repeat(4 - currentPin.length)).trim();
};

window.submitPinChange = async () => {
    try {
        const res = await authFetch(`${API_URL}/change-pin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: parseInt(state.currentUserId),
                old_pin: oldPin,
                new_pin: newPin
            })
        });
        
        if (res.ok) {
            alert("PIN changed successfully!");
            window.closePinModal();
        } else {
            const err = await res.json();
            alert(err.error || "Failed to change PIN");
            window.closePinModal();
            window.openPinModal(); 
        }
    } catch (e) {
        alert("Server connection error.");
        window.closePinModal();
    }
};

// ==========================================
// ZABEZPIECZONE AKCJE USUWANIA
// ==========================================

window.triggerClearHistory = async () => {
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    const confirmClear = confirm("Are you sure you want to delete ALL your workout history? This cannot be undone.");
    if (!confirmClear) return;

    try {
        // ZAKTUALIZOWANA ŚCIEŻKA (zgodnie z main.go)
        const res = await authFetch(`${API_URL}/history/${state.currentUserId}`, { method: 'DELETE' });
        if (res.ok) {
            alert("Workout history cleared!");
        } else {
            alert("Failed to clear history.");
        }
    } catch(e) {
        alert("Server error.");
    }
};

window.triggerDeleteAccount = async () => {
    if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
    
    const safetyCheck = prompt('DANGER! Type "DELETE" to permanently erase your account and all data:');
    if (safetyCheck !== "DELETE") {
        return alert("Action aborted.");
    }

    try {
        // ZAKTUALIZOWANA ŚCIEŻKA (zgodnie z main.go)
        const res = await authFetch(`${API_URL}/account/${state.currentUserId}`, { method: 'DELETE' });
        if (res.ok) {
            alert("Account deleted. Goodbye!");
            logout();
        } else {
            alert("Failed to delete account.");
        }
    } catch(e) {
        alert("Server error.");
    }
};