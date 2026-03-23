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
const exerciseSchema = [
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

/**
 * API Wrapper: Injects Authorization headers if a token exists
 */
export function authFetch(url, options = {}) {
    if (state.token) {
        options.headers = { 
            ...options.headers, 
            'Authorization': `Bearer ${state.token}` 
        };
    }
    return fetch(url, options);
}

/**
 * Standard Logout Procedure
 */
export function logout() {
    localStorage.removeItem('selectedUserId');
    localStorage.removeItem('selectedUserName');
    localStorage.removeItem('authToken');
    location.reload();
}

/**
 * EXERCISE SELECTION WIZARD (UI Component)
 * A multi-step modal for searching, filtering, and configuring exercises.
 */
window.openExerciseWizard = (onCompleteCallback) => {
    const modal = document.createElement("div");
    modal.className = "modal-overlay dialog-overlay";
    modal.id = "ex-wizard";

    let selectedEx = null;
    let selEq = "", selAng = "", selVar = "";
    let currentCat = "All";
    const categories = ["All", ...new Set(exerciseSchema.map(e => e.category))];

    // Initial Modal Structure
    modal.innerHTML = `
        <div class="modal-content" style="display:flex; flex-direction:column; max-height: 90vh;">
            <div class="modal-header" id="wiz-header" style="display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
                <h3 style="margin:0; font-size:20px; color:var(--primary);">Select Exercise</h3>
                <button onclick="document.body.removeChild(document.getElementById('ex-wizard'))" class="close-btn">&times;</button>
            </div>
            <div id="wiz-filters" class="wizard-filter-bar"></div>
            <div class="modal-body" id="wiz-body" style="overflow-y:auto; flex-grow:1; padding-top: 15px;"></div>
            <div class="modal-footer" id="wiz-footer" style="flex-shrink:0; display:none;"></div>
        </div>
    `;

    document.body.appendChild(modal);

    const wizHeader = document.getElementById("wiz-header");
    const wizFilters = document.getElementById("wiz-filters");
    const wizBody = document.getElementById("wiz-body");
    const wizFooter = document.getElementById("wiz-footer");

    // --- Step 1: Browse and Filter ---
    const renderStep1 = () => {
        wizFilters.style.display = "block";
        wizFooter.style.display = "none";
        wizHeader.innerHTML = `
            <h3 style="margin:0; font-size:20px; color:var(--primary);">Select Exercise</h3>
            <button onclick="document.body.removeChild(document.getElementById('ex-wizard'))" class="close-btn">&times;</button>
        `;

        renderFilters();
        renderGrid();
    };

    const renderFilters = () => {
        wizFilters.innerHTML = categories.map(cat => `
            <button onclick="window._wizSetCat('${cat}')" class="filter-chip ${currentCat === cat ? 'active' : ''}">
                ${cat}
            </button>
        `).join('');
    };

    const renderGrid = () => {
        const list = currentCat === "All" ? exerciseSchema : exerciseSchema.filter(e => e.category === currentCat);
        wizBody.innerHTML = `
            <div class="exercise-grid">
                ${list.map(ex => `
                    <div class="ex-card" onclick="window._wizSelBase('${ex.name}')">
                        <div class="ex-card-title">${ex.name}</div>
                        <div class="ex-card-cat">${ex.category}</div>
                    </div>
                `).join('')}
            </div>
        `;
    };

    window._wizSetCat = (cat) => {
        currentCat = cat;
        renderFilters();
        renderGrid();
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
            renderStep2();
        }
    };

    // --- Step 2: Configure Options ---
    const drawOpts = (title, items, current, type) => {
        if (!items || items.length === 0) return "";
        return `
            <div class="option-group">
                <label class="option-label">${title}</label>
                <div class="option-container">
                    ${items.map(item => `
                        <button onclick="window._wizUpd('${type}', '${item}')" class="option-btn ${item === current ? 'active' : ''}">
                            ${item}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    };

    const renderStep2 = () => {
        wizFilters.style.display = "none";
        wizFooter.style.display = "block";
        
        wizHeader.innerHTML = `
            <button onclick="window._wizGoBack()" class="back-btn">← Back</button>
            <h3 style="margin:0; font-size:18px;">Configure</h3>
            <div style="width:40px;"></div>
        `;

        updateStep2Body();
        wizFooter.innerHTML = `<button onclick="window._wizFinish()" id="wiz-conf-btn" class="save-btn success">Confirm & Add</button>`;
    };

    const updateStep2Body = () => {
        wizBody.innerHTML = `
            <h2 class="wizard-title">${selectedEx.name}</h2>
            ${drawOpts('Equipment', selectedEx.equipment, selEq, 'eq')}
            ${drawOpts('Angle', selectedEx.angles, selAng, 'ang')}
            ${drawOpts('Variant', selectedEx.variants, selVar, 'var')}
            
            <div class="final-name-preview">
                <div class="preview-label">FINAL EXERCISE NAME</div>
                <div class="preview-value">${buildName()}</div>
            </div>
        `;
    };

    window._wizUpd = (type, val) => {
        if(type==='eq') selEq = val;
        if(type==='ang') selAng = val;
        if(type==='var') selVar = val;
        updateStep2Body();
    };

    window._wizGoBack = () => renderStep1();

    const buildName = () => {
        let parts = [];
        if (selAng && selAng !== "Flat") parts.push(selAng);
        if (selEq && selEq !== "Bodyweight") parts.push(selEq);
        parts.push(selectedEx.name);
        if (selVar && selVar !== "Standard") parts.push("- " + selVar);
        return parts.join(" ").replace(/\s+/g, " ").trim();
    };

    window._wizFinish = () => finishWizard();

    /**
     * Finalizes selection and syncs with the Backend
     */
    const finishWizard = async () => {
        const finalName = buildName();
        const category = selectedEx.category;
        
        const btn = document.getElementById("wiz-conf-btn");
        if(btn) { btn.innerText = "Syncing..."; btn.disabled = true; }

        try {
            // Integration with Go Backend: Find existing or create new exercise ID
            const res = await authFetch(`${API_URL}/exercises/find-or-create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: finalName, category: category })
            });
            
            if(!res.ok) throw new Error("Backend Sync Failed");
            const data = await res.json(); 
            
            document.body.removeChild(modal);
            if(onCompleteCallback) onCompleteCallback(data);
        } catch(e) {
            console.error("Wizard Sync Error:", e);
            alert("Connection error. Could not sync exercise with server.");
            if(btn) { btn.innerText = "Confirm & Add"; btn.disabled = false; }
        }
    };

    renderStep1();
};