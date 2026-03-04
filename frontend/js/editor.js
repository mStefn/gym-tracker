import { state, API_URL, authFetch } from './state.js';

let exercisesCache = null;
let selectedExercisesForPlan = [];

export async function renderPlanEditor() {
    const container = document.getElementById("exercises");
    
    selectedExercisesForPlan = []; 
    
    container.innerHTML = `
        <div style="text-align:center; margin-top:100px;">
            <div class="spinner"></div>
            <p style="color:#8e8e93; margin-top:20px;">Loading exercise database...</p>
        </div>
    `;

    try {
        const res = await authFetch(`${API_URL}/exercises`);
        if (!res.ok) throw new Error("Server error");
        exercisesCache = await res.json();

        container.innerHTML = `
            <div style="padding: 10px;">
                <button onclick="window.navigate('workout')" style="background: transparent; border: none; color: var(--primary); padding: 0; margin-bottom: 20px; font-size: 16px; font-weight: 600; cursor: pointer;">← Cancel</button>
                <h2 style="margin-top:0; margin-bottom: 20px;">Create New Plan</h2>
                
                <div class="exercise-card">
                    <input type="text" id="new-plan-name" placeholder="Plan name (e.g. Chest + Biceps)" style="text-align:left; padding-left:15px; margin-bottom:20px; font-weight: 600;">
                    
                    <div id="exercises-setup"></div>
                    
                    <button id="add-ex-btn" class="btn-nav btn-signup" style="width:100%; margin-top:10px; border: 2px dashed var(--primary); padding: 15px; font-size: 16px;">
                        + Add Exercises
                    </button>
                    
                    <div style="margin-top:30px;">
                        <button id="save-plan-btn" class="save-btn" style="background:var(--success);">Save Workout Plan</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('add-ex-btn').addEventListener('click', () => {
            window.openExercisePicker();
        });

        document.getElementById('save-plan-btn').addEventListener('click', () => {
            window.saveFullPlan();
        });
        
        window.renderSelectedList();

    } catch (err) {
        console.error("Editor error:", err);
        container.innerHTML = `<p style="color:var(--danger); text-align:center;">Failed to load exercises. Check server connection.</p>`;
    }
}

window.renderSelectedList = () => {
    const list = document.getElementById("exercises-setup");
    list.innerHTML = "";
    
    if (selectedExercisesForPlan.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#8e8e93; font-size:14px; margin-bottom:20px;">No exercises added yet.</p>`;
        return;
    }

    selectedExercisesForPlan.forEach(exId => {
        const ex = exercisesCache.find(e => e.id === exId);
        if(!ex) return;

        const div = document.createElement("div");
        div.className = "selected-ex-row";
        div.innerHTML = `
            <div style="flex:1;">
                <div style="font-weight:600; font-size:15px; color:var(--text);">${ex.name}</div>
                <div style="font-size:12px; color:#8e8e93; margin-top: 4px;">${ex.category}</div>
            </div>
            <div style="display:flex; align-items:center; gap:15px;">
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <label style="font-size:11px; color:#8e8e93; font-weight: 600; margin-bottom:4px;">Sets</label>
                    <input type="number" class="ex-sets" data-id="${ex.id}" value="3" min="1" max="10" style="width:60px; padding:10px; margin:0; text-align:center; border-radius:10px;">
                </div>
                <button type="button" onclick="window.removeExercise(${ex.id})" style="background:none; border:none; color:var(--danger); font-size:24px; padding:5px; cursor:pointer; display:flex; align-items:center;">✕</button>
            </div>
        `;
        list.appendChild(div);
    });
};

window.removeExercise = (id) => {
    selectedExercisesForPlan = selectedExercisesForPlan.filter(exId => exId !== id);
    window.renderSelectedList();
};

// --- NAPRAWIONA LOGIKA MODALA ---
window.openExercisePicker = () => {
    let tempSelected = [...selectedExercisesForPlan]; 
    let currentFilter = 'All';
    const categories = ['All', ...new Set(exercisesCache.map(ex => ex.category))];
    
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.id = "ex-picker-modal";

    // Budujemy szkielet Modala tylko RAZ
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 style="margin:0;">Select Exercises</h3>
                <button onclick="window.closePicker()" style="background:none; border:none; font-size:16px; color:var(--primary); font-weight:600; cursor:pointer;">Cancel</button>
            </div>
            
            <div class="modal-filters">
                <div class="filter-container" id="picker-filters"></div>
            </div>

            <div class="modal-body" id="picker-body">
                <div class="exercise-grid" id="picker-grid"></div>
            </div>

            <div class="modal-footer">
                <button id="confirm-selection-btn" onclick="window.confirmSelection()" class="save-btn">Add Selected (${tempSelected.length})</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);

    const filterContainer = document.getElementById("picker-filters");
    const gridContainer = document.getElementById("picker-grid");
    const confirmBtn = document.getElementById("confirm-selection-btn");

    // Generujemy filtry
    filterContainer.innerHTML = categories.map(cat => 
        `<button class="filter-badge ${currentFilter === cat ? 'active' : ''}" onclick="window.setFilter('${cat}')">${cat}</button>`
    ).join('');

    // Funkcja odrysowująca TYLKO siatkę ćwiczeń (używana przy zmianie kategorii)
    window.renderGrid = () => {
        const filteredEx = currentFilter === 'All' 
            ? exercisesCache 
            : exercisesCache.filter(ex => ex.category === currentFilter);

        gridContainer.innerHTML = filteredEx.map(ex => {
            const isSelected = tempSelected.includes(ex.id);
            return `
                <div class="ex-card ${isSelected ? 'selected' : ''}" id="ex-card-${ex.id}" onclick="window.toggleExSelection(${ex.id})">
                    <div id="ex-icon-${ex.id}" style="font-size: 24px; margin-bottom: 5px;">${isSelected ? '☑️' : '◻️'}</div>
                    <div class="ex-card-title">${ex.name}</div>
                    <div class="ex-card-cat">${ex.category}</div>
                </div>
            `;
        }).join('');
    };

    // Optymalne zaznaczanie (bez przeładowywania siatki!)
    window.toggleExSelection = (id) => {
        const index = tempSelected.indexOf(id);
        const card = document.getElementById(`ex-card-${id}`);
        const icon = document.getElementById(`ex-icon-${id}`);

        if (index > -1) {
            tempSelected.splice(index, 1);
            if(card) card.classList.remove('selected');
            if(icon) icon.innerText = '◻️';
        } else {
            tempSelected.push(id);
            if(card) card.classList.add('selected');
            if(icon) icon.innerText = '☑️';
        }
        
        // Aktualizuj tylko napis na przycisku
        confirmBtn.innerText = `Add Selected (${tempSelected.length})`;
    };

    window.setFilter = (cat) => {
        currentFilter = cat;
        // Zmień aktywny przycisk filtra
        Array.from(filterContainer.children).forEach(btn => {
            btn.classList.toggle('active', btn.innerText === cat);
        });
        window.renderGrid();
    };

    window.confirmSelection = () => {
        selectedExercisesForPlan = [...tempSelected];
        window.renderSelectedList();
        document.body.removeChild(modal);
    };

    window.closePicker = () => {
        document.body.removeChild(modal);
    };

    // Pierwsze rysowanie siatki
    window.renderGrid();
};

window.saveFullPlan = async () => {
    const nameInput = document.getElementById("new-plan-name");
    const planName = nameInput.value.trim();
    if (!planName) return alert("Enter a plan name");

    const inputs = document.querySelectorAll(".ex-sets");
    const selections = [];
    
    inputs.forEach(input => {
        const id = parseInt(input.getAttribute("data-id"));
        const sets = parseInt(input.value);
        if (id && sets) selections.push({ id, sets });
    });

    if (selections.length === 0) return alert("Add at least one exercise");

    const saveBtn = document.getElementById('save-plan-btn');
    saveBtn.innerText = "Saving...";
    saveBtn.disabled = true;

    try {
        const res = await authFetch(`${API_URL}/plans`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ name: planName, user_id: parseInt(state.currentUserId) })
        });
        
        const planData = await res.json();
        for (const s of selections) {
            await authFetch(`${API_URL}/plan-exercises`, {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({ plan_id: planData.id, exercise_id: s.id, target_sets: s.sets })
            });
        }
        window.navigate('workout');
    } catch (e) {
        alert("Save failed");
        saveBtn.innerText = "Save Workout Plan";
        saveBtn.disabled = false;
    }
};