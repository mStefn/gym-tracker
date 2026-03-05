export const state = {
    currentUserId: localStorage.getItem('selectedUserId'),
    currentUserName: localStorage.getItem('selectedUserName'),
    token: localStorage.getItem('authToken'),
    tempPin: "",
    mode: ""
};

export const API_URL = `http://${window.location.hostname}:5001`;

// --- SCHEMAT KREATORA ---
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

export function authFetch(url, options = {}) {
    if (state.token) {
        options.headers = { ...options.headers, 'Authorization': `Bearer ${state.token}` };
    }
    return fetch(url, options);
}

export function logout() {
    localStorage.removeItem('selectedUserId');
    localStorage.removeItem('selectedUserName');
    localStorage.removeItem('authToken');
    location.reload();
}

// --- GLOBALNY WIZARD (KREATOR) ---
window.openExerciseWizard = (onCompleteCallback) => {
    const modal = document.createElement("div");
    modal.className = "modal-overlay dialog-overlay";
    modal.id = "ex-wizard";

    let selectedEx = null, selEq = "", selAng = "", selVar = "";

    const renderStep1 = () => {
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; font-size:20px; color:var(--primary);">Select Exercise</h3>
                    <button onclick="document.body.removeChild(document.getElementById('ex-wizard'))" style="background:none; border:none; color:var(--text); font-size:24px; cursor:pointer;">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="exercise-grid">
                        ${exerciseSchema.map(ex => `
                            <div class="ex-card" onclick="window._wizSelBase('${ex.name}')">
                                <div class="ex-card-title">${ex.name}</div>
                                <div class="ex-card-cat">${ex.category}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    };

    window._wizSelBase = (name) => {
        selectedEx = exerciseSchema.find(e => e.name === name);
        const hasOptions = (selectedEx.equipment && selectedEx.equipment.length > 0) || 
                           (selectedEx.angles && selectedEx.angles.length > 0) || 
                           (selectedEx.variants && selectedEx.variants.length > 0);
                           
        if (!hasOptions) {
            finishWizard();
        } else {
            selEq = selectedEx.equipment?.[0] || "";
            selAng = selectedEx.angles?.[0] || "";
            selVar = selectedEx.variants?.[0] || "";
            renderStep2();
        }
    };

    const drawOpts = (title, items, current, type) => {
        if (!items || items.length === 0) return "";
        return `
            <div style="margin-bottom: 20px;">
                <label style="font-size:12px; color:#8e8e93; font-weight:600; text-transform:uppercase;">${title}</label>
                <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:8px;">
                    ${items.map(item => `
                        <button onclick="window._wizUpd('${type}', '${item}')" 
                                style="padding: 10px 15px; border-radius: 12px; border: 1px solid ${item === current ? 'var(--primary)' : 'var(--border)'}; background: ${item === current ? 'rgba(0, 210, 255, 0.1)' : 'transparent'}; color: var(--text); cursor:pointer; font-weight:600; transition: all 0.2s;">
                            ${item}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    };

    const renderStep2 = () => {
        modal.innerHTML = `
            <div class="modal-content" style="height: auto; max-height: 90vh;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <button onclick="window._wizGoBack()" style="background:none; border:none; color:var(--primary); font-size:16px; font-weight:600; cursor:pointer;">← Back</button>
                    <h3 style="margin:0; font-size:18px;">Configure</h3>
                    <div style="width:50px;"></div>
                </div>
                <div class="modal-body">
                    <h2 style="margin-top:0; margin-bottom: 25px; color:var(--primary); text-align:center;">${selectedEx.name}</h2>
                    ${drawOpts('Equipment', selectedEx.equipment, selEq, 'eq')}
                    ${drawOpts('Angle', selectedEx.angles, selAng, 'ang')}
                    ${drawOpts('Variant', selectedEx.variants, selVar, 'var')}
                    
                    <div style="margin-top: 30px; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 12px; text-align:center; border: 1px solid var(--border);">
                        <div style="font-size:12px; color:#8e8e93; margin-bottom:5px; font-weight:600;">FINAL EXERCISE</div>
                        <div style="font-weight:bold; font-size:18px; color:var(--success);">${buildName()}</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="window._wizFinish()" class="save-btn" style="background:var(--success);">Confirm & Add</button>
                </div>
            </div>
        `;
    };

    window._wizUpd = (type, val) => {
        if(type==='eq') selEq = val;
        if(type==='ang') selAng = val;
        if(type==='var') selVar = val;
        renderStep2();
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

    const finishWizard = () => {
        document.body.removeChild(modal);
        if(onCompleteCallback) onCompleteCallback(buildName());
    };

    renderStep1();
    document.body.appendChild(modal);
};