import { state, API_URL, authFetch, logout } from './state.js';

/**
 * Renders the main Settings view including account management and PWA install options.
 */
export function renderSettings() {
    const container = document.getElementById("exercises");
    
    // Check if the app is already running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    
    let installBtnHtml = '';
    if (!isStandalone) {
        installBtnHtml = `
            <div class="settings-section centered">
                <h3 class="section-title">Install App</h3>
                <p class="section-desc">Install Gym Tracker on your home screen for a full-screen, native experience.</p>
                <button id="install-btn" class="save-btn primary-glow">📲 Install App</button>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="view-container">
            <button onclick="window.navigate('home')" class="back-link">← Back</button>
            <h2 class="view-title">Settings</h2>
            
            <div class="settings-section">
                <h3 class="section-title">Account</h3>
                <p class="section-desc">Authenticated as: <strong class="highlight">${state.currentUserName}</strong></p>
                
                <div class="action-stack">
                    <button onclick="window.openPinModal()" class="btn-settings-item">🔑 Change PIN</button>
                    <button onclick="window.triggerClearHistory()" class="btn-settings-item warning">🗑️ Clear Workout History</button>
                    <button onclick="window.triggerDeleteAccount()" class="btn-settings-item danger">⚠️ Delete Account</button>
                </div>
            </div>

            ${installBtnHtml}

            <div class="logout-wrapper">
                <button onclick="window.appLogout()" class="btn-outline-danger">Logout</button>
            </div>
        </div>
    `;

    // Re-attach event listener for the PWA installation button
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (navigator.vibrate) navigator.vibrate(10);
            
            // If the browser captured the install prompt, trigger it
            if (window.deferredPrompt) {
                window.deferredPrompt.prompt();
                const { outcome } = await window.deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    window.deferredPrompt = null;
                    installBtn.style.display = 'none'; 
                }
            } else {
                // Fallback for iOS/Browsers that don't support automated prompts
                window.openInstallModal();
            }
        });
    }
}

// --- PWA INSTALL MODAL CONTROLS ---
window.openInstallModal = () => {
    const overlay = document.getElementById('install-guide-overlay');
    if (overlay) overlay.classList.add('show');
};
window.closeInstallModal = () => {
    const overlay = document.getElementById('install-guide-overlay');
    if (overlay) overlay.classList.remove('show');
};

// ==========================================
// PIN PAD LOGIC (Security Management)
// ==========================================
let oldPin = "";
let newPin = "";
let pinMode = "old"; 

window.openPinModal = () => {
    oldPin = ""; newPin = ""; pinMode = "old";

    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.id = "pin-modal";
    
    modal.innerHTML = `
        <div class="modal-content pin-pad-modal">
            <button onclick="window.closePinModal()" class="close-x">&times;</button>
            
            <h2 id="pin-title" class="pin-modal-title">ENTER OLD PIN</h2>
            
            <div id="pin-area">
                <div id="pin-display" class="pin-dots">○ ○ ○ ○</div>
                
                <div class="pin-grid">
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
            alert("Please enter a 4-digit PIN.");
            return;
        }
    } else {
        if (currentPin.length < 4) currentPin += k;
    }

    if (pinMode === 'old') oldPin = currentPin;
    else newPin = currentPin;

    document.getElementById("pin-display").innerText = ("● ".repeat(currentPin.length) + "○ ".repeat(4 - currentPin.length)).trim();
};

/**
 * Backend Sync: Submits the PIN change request
 */
window.submitPinChange = async () => {
    try {
        const res = await authFetch(`${API_URL}/change-pin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                old_pin: oldPin,
                new_pin: newPin
            })
        });
        
        if (res.ok) {
            alert("Security update: PIN changed successfully!");
            window.closePinModal();
        } else {
            const err = await res.json();
            alert(err.error || "Failed to change PIN. Verify your old PIN.");
            window.closePinModal();
            window.openPinModal(); 
        }
    } catch (e) {
        alert("Infrastructure error: Server unreachable.");
        window.closePinModal();
    }
};

/**
 * Destructive Action: Clears user logs (Database cleanup)
 */
window.triggerClearHistory = async () => {
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    const confirmClear = confirm("Critical Action: Are you sure you want to delete ALL your workout history? This cannot be undone.");
    if (!confirmClear) return;

    try {
        const res = await authFetch(`${API_URL}/history/${state.currentUserId}`, { method: 'DELETE' });
        if (res.ok) {
            alert("Database synchronized: Workout history cleared.");
        } else {
            alert("Error: Operation failed on server.");
        }
    } catch(e) {
        alert("Server error.");
    }
};

/**
 * Critical Action: Permanent account deletion
 */
window.triggerDeleteAccount = async () => {
    if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
    
    const safetyCheck = prompt('DANGER! Type "DELETE" to permanently erase your account and all telemetry data:');
    if (safetyCheck !== "DELETE") {
        return alert("Security check failed. Action aborted.");
    }

    try {
        const res = await authFetch(`${API_URL}/account/${state.currentUserId}`, { method: 'DELETE' });
        if (res.ok) {
            alert("Account terminated. Data scrubbed.");
            logout();
        } else {
            alert("Failed to delete account.");
        }
    } catch(e) {
        alert("Server connection error.");
    }
};