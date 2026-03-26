/**
 * Global Application State
 * Managed via LocalStorage for persistence across sessions
 */
export const state = {
    currentUserId: localStorage.getItem('selectedUserId'),
    currentUserName: localStorage.getItem('selectedUserName'),
    token: localStorage.getItem('authToken'),
    tempPin: "",
    mode: ""
};

/**
 * Dynamic API URL
 * Automatically points to the host's port 5001, perfect for Tailscale environments.
 */
export const API_URL = `http://${window.location.hostname}:5001`;

/**
 * MASTER EXERCISE SCHEMA
 * Used to populate the Exercise Wizard and provide structured metadata.
 */
export const exerciseSchema = [
    { name: "Bench Press", category: "Chest", equipment: ["Barbell", "Dumbbell", "Machine"], angles: ["Flat", "Incline", "Decline"] },
    { name: "Chest Fly", category: "Chest", equipment: ["Dumbbell", "Machine", "Cable"] },
    { name: "Push-Up", category: "Chest", equipment: ["Bodyweight"] },
    { name: "Pull-Up", category: "Back", equipment: ["Bodyweight", "Assisted"] },
    { name: "Row", category: "Back", equipment: ["Barbell", "Cable", "T-Bar", "Dumbbell", "Machine"] },
    { name: "Lat Pulldown", category: "Back", equipment: ["Cable", "Machine"] },
    { name: "Straight Arm Pulldown", category: "Back", equipment: ["Cable"] },
    { name: "Squat", category: "Legs", equipment: ["Barbell", "Dumbbell", "Machine"] },
    { name: "Deadlift", category: "Legs", equipment: ["Barbell", "Dumbbell"] },
    { name: "Romanian Deadlift", category: "Legs", equipment: ["Barbell", "Dumbbell"] },
    { name: "Leg Press", category: "Legs", equipment: ["Machine"] },
    { name: "Leg Extension", category: "Legs", equipment: ["Machine"] },
    { name: "Leg Curl", category: "Legs", equipment: ["Machine"] },
    { name: "Hip Thrust", category: "Legs", equipment: ["Barbell", "Machine"] },
    { name: "Lunge", category: "Legs", equipment: ["Dumbbell", "Barbell"], variants: ["Walking", "Bulgarian"] },
    { name: "Calf Raise", category: "Legs", equipment: ["Machine", "Bodyweight", "Barbell"] },
    { name: "Hip Abduction", category: "Legs", equipment: ["Machine"] },
    { name: "Hip Adduction", category: "Legs", equipment: ["Machine"] },
    { name: "Shoulder Press", category: "Shoulders", equipment: ["Barbell", "Dumbbell", "Machine"] },
    { name: "Lateral Raise", category: "Shoulders", equipment: ["Dumbbell", "Cable"] },
    { name: "Front Raise", category: "Shoulders", equipment: ["Dumbbell", "Cable"] },
    { name: "Rear Delt Fly", category: "Shoulders", equipment: ["Machine", "Dumbbell"] },
    { name: "Face Pull", category: "Shoulders", equipment: ["Cable"] },
    { name: "Upright Row", category: "Shoulders", equipment: ["Barbell", "Cable"] },
    { name: "Biceps Curl", category: "Biceps", equipment: ["Barbell", "Dumbbell", "Cable", "Machine"], variants: ["Standard", "Hammer", "Preacher"] },
    { name: "Triceps Extension", category: "Triceps", equipment: ["Cable", "Dumbbell", "Barbell"], variants: ["Pushdown", "Overhead", "Skull Crusher"] },
    { name: "Dip", category: "Triceps", equipment: ["Bodyweight", "Machine"] },
    { name: "Close Grip Bench Press", category: "Triceps", equipment: ["Barbell"] },
    { name: "Plank", category: "Abs", equipment: ["Bodyweight"] },
    { name: "Leg Raise", category: "Abs", equipment: ["Bodyweight"], variants: ["Hanging", "Lying"] },
    { name: "Crunch", category: "Abs", equipment: ["Machine", "Cable", "Bodyweight"] },
    { name: "Ab Wheel Rollout", category: "Abs", equipment: ["Ab Wheel"] },
    { name: "Russian Twist", category: "Abs", equipment: ["Bodyweight", "Weight"] },
    { name: "Sit-Up", category: "Abs", equipment: ["Bodyweight", "Weight"] }
];

export function authFetch(url, options = {}) {
    if (state.token) {
        options.headers = { 
            ...options.headers, 
            'Authorization': `Bearer ${state.token}` 
        };
    }
    return fetch(url, options);
}

export function logout() {
    localStorage.removeItem('selectedUserId');
    localStorage.removeItem('selectedUserName');
    localStorage.removeItem('authToken');
    location.reload();
}

window.wizardClose = () => {
    const modal = document.getElementById('ex-wizard');
    if (modal) {
        modal.classList.remove('show'); 
        setTimeout(() => { if (modal.parentNode) modal.parentNode.removeChild(modal); }, 200);
    }
};

/**
 * EXERCISE SELECTION WIZARD (3-Step Funnel)
 */
window.openExerciseWizard = (onCompleteCallback) => {
    const modal = document.createElement("div");
    modal.className = "modal-overlay dialog-overlay show"; 
    modal.id = "ex-wizard";

    let currentCat = null;
    let selectedEx = null;
    let selEq = "", selAng = "", selVar = "";
    
    // Unikalne kategorie
    const categories = [...new Set(exerciseSchema.map(e => e.category))];

    modal.innerHTML = `
        <div class="modal-content" style="display:flex; flex-direction:column; max-height: 90vh;">
            <div class="modal-header" id="wiz-header" style="display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
                </div>
            <div class="modal-body" id="wiz-body" style="overflow-y:auto; flex-grow:1; padding-top: 15px;"></div>
            <div class="modal-footer" id="wiz-footer" style="flex-shrink:0; display:none;"></div>
        </div>
    `;

    document.body.appendChild(modal);

    const wizHeader = document.getElementById("wiz-header");
    const wizBody = document.getElementById("wiz-body");
    const wizFooter = document.getElementById("wiz-footer");

    // --- KROK 1: Wybór partii mięśniowej ---
    const renderStep1_Categories = () => {
        wizFooter.style.display = "none";
        wizHeader.innerHTML = `
            <div style="width:28px;"></div> <h3 style="margin:0; font-size:20px; color:var(--primary); text-align:center;">Select Muscle Group</h3>
            <button onclick="window.wizardClose()" class="close-x">&times;</button>
        `;

        wizBody.innerHTML = `
            <div class="tile-grid">
                ${categories.map(cat => `
                    <div class="wizard-tile" onclick="window._wizGoToStep2('${cat}')">
                        <div class="ex-name" style="font-size: 16px;">${cat}</div>
                    </div>
                `).join('')}
            </div>
        `;
    };

    window._wizGoToStep2 = (cat) => {
        currentCat = cat;
        renderStep2_Exercises();
    };

    // --- KROK 2: Wybór bazy ćwiczenia z danej partii ---
    const renderStep2_Exercises = () => {
        wizFooter.style.display = "none";
        wizHeader.innerHTML = `
            <button onclick="window._wizGoBackToStep1()" class="back-arrow">←</button>
            <h3 style="margin:0; font-size:20px; color:var(--primary); text-align:center;">${currentCat}</h3>
            <div style="width:28px;"></div>
        `;

        const list = exerciseSchema.filter(e => e.category === currentCat);
        wizBody.innerHTML = `
            <div class="tile-grid">
                ${list.map(ex => `
                    <div class="wizard-tile" onclick="window._wizSelBase('${ex.name}')">
                        <div class="ex-name">${ex.name}</div>
                    </div>
                `).join('')}
            </div>
        `;
    };

    window._wizGoBackToStep1 = () => {
        currentCat = null;
        renderStep1_Categories();
    };

    window._wizSelBase = (name) => {
        selectedEx = exerciseSchema.find(e => e.name === name);
        const hasOptions = (selectedEx.equipment?.length > 0) || (selectedEx.angles?.length > 0) || (selectedEx.variants?.length > 0);
        
        if (!hasOptions) {
            finishWizard();
        } else {
            selEq = selectedEx.equipment?.[0] || "";
            selAng = selectedEx.angles?.[0] || "";
            selVar = selectedEx.variants?.[0] || "";
            renderStep3_Config();
        }
    };

    // --- KROK 3: Konfiguracja opcji (sprzęt, wariant, kąt) ---
    const drawOpts = (title, items, current, type) => {
        if (!items || items.length === 0) return "";
        return `
            <div class="input-group">
                <label class="field-label">${title}</label>
                <div class="tile-grid">
                    ${items.map(item => `
                        <button onclick="window._wizUpd('${type}', '${item}')" class="wizard-tile ${item === current ? 'active' : ''}">
                            ${item}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    };

    const renderStep3_Config = () => {
        wizFooter.style.display = "block";
        
        wizHeader.innerHTML = `
            <button onclick="window._wizGoBackToStep2()" class="back-arrow">←</button>
            <h3 class="wizard-step-title" style="text-align:center;">Configure</h3>
            <div style="width:28px;"></div>
        `;

        updateStep3Body();
        wizFooter.innerHTML = `<button onclick="window._wizFinish()" id="wiz-conf-btn" class="save-btn success-bg">Confirm & Add</button>`;
    };

    const updateStep3Body = () => {
        wizBody.innerHTML = `
            <h2 class="view-title centered" style="margin-bottom:20px;">${selectedEx.name}</h2>
            ${drawOpts('Equipment', selectedEx.equipment, selEq, 'eq')}
            ${drawOpts('Angle', selectedEx.angles, selAng, 'ang')}
            ${drawOpts('Variant', selectedEx.variants, selVar, 'var')}
            
            <div class="editor-card centered" style="margin-top:20px; border-style:dashed;">
                <div class="field-label">FINAL NAME</div>
                <div class="view-title" style="font-size:18px; color:var(--primary);">${buildName()}</div>
            </div>
        `;
    };

    window._wizUpd = (type, val) => {
        if(type==='eq') selEq = val;
        if(type==='ang') selAng = val;
        if(type==='var') selVar = val;
        updateStep3Body();
    };

    window._wizGoBackToStep2 = () => {
        selectedEx = null;
        renderStep2_Exercises();
    };

    const buildName = () => {
        let parts = [];
        if (selAng && selAng !== "Flat") parts.push(selAng);
        if (selEq && selEq !== "Bodyweight") parts.push(selEq);
        parts.push(selectedEx.name);
        if (selVar && selVar !== "Standard") parts.push("- " + selVar);
        return parts.join(" ").replace(/\s+/g, " ").trim();
    };

    window._wizFinish = () => finishWizard();

    const finishWizard = async () => {
        const finalName = buildName();
        const category = selectedEx.category;
        
        const btn = document.getElementById("wiz-conf-btn");
        if(btn) { btn.innerText = "Syncing..."; btn.disabled = true; }

        try {
            const res = await authFetch(`${API_URL}/exercises/find-or-create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: finalName, category: category })
            });
            
            if(!res.ok) throw new Error("Backend Sync Failed");
            const data = await res.json(); 
            
            window.wizardClose();
            if(onCompleteCallback) onCompleteCallback(data);
        } catch(e) {
            console.error("Wizard Sync Error:", e);
            alert("Connection error. Could not sync exercise with server.");
            if(btn) { btn.innerText = "Confirm & Add"; btn.disabled = false; }
        }
    };

    // Odpalamy Krok 1
    renderStep1_Categories();
};