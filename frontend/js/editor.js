import { state, API_URL } from './state.js';

// Zmienna modułowa
let exercisesCache = null;

export async function renderPlanEditor() {
    const container = document.getElementById("exercises");
    
    // 1. Loader
    container.innerHTML = `
        <div style="text-align:center; margin-top:100px;">
            <div class="spinner"></div>
            <p style="color:#8e8e93; margin-top:20px;">Wczytywanie bazy ćwiczeń...</p>
        </div>
    `;

    try {
        // 2. Pobieranie danych
        const res = await fetch(`${API_URL}/exercises`);
        if (!res.ok) throw new Error("Błąd serwera");
        exercisesCache = await res.json();

        // 3. Renderowanie szkieletu
        container.innerHTML = `
            <div style="padding: 20px;">
                <button onclick="location.reload()" class="nav-link">← Anuluj</button>
                <h2 style="margin-top:20px;">Nowy Plan</h2>
                <div class="exercise-card">
                    <input type="text" id="new-plan-name" placeholder="Nazwa planu (np. Klatka + Biceps)" style="text-align:left; padding-left:15px; margin-bottom:20px;">
                    
                    <div id="exercises-setup"></div>
                    
                    <button id="add-ex-btn" class="btn-nav btn-signup" style="width:100%; margin-top:10px; border-style:dashed;">
                        + Dodaj ćwiczenie
                    </button>
                    
                    <div style="margin-top:30px;">
                        <button id="save-plan-btn" class="save-btn" style="background:var(--success);">Zapisz Trening</button>
                    </div>
                </div>
            </div>
        `;

        // 4. Podpięcie zdarzeń (rezygnujemy z onclick w HTML na rzecz addEventListener)
        document.getElementById('add-ex-btn').addEventListener('click', () => {
            window.addExerciseField();
        });

        document.getElementById('save-plan-btn').addEventListener('click', () => {
            window.saveFullPlan();
        });
        
        // 5. Dodaj pierwszy wiersz na start
        window.addExerciseField();

    } catch (err) {
        console.error("Błąd edytora:", err);
        container.innerHTML = `<p style="color:red; text-align:center;">Nie udało się pobrać ćwiczeń. Sprawdź połączenie z bazą.</p>`;
    }
}

window.addExerciseField = () => {
    const setupArea = document.getElementById("exercises-setup");
    if (!setupArea || !exercisesCache) {
        console.error("Błąd: Próba dodania pola bez załadowanych danych!");
        return;
    }

    const div = document.createElement("div");
    div.className = "exercise-row-setup";
    div.style = "display:flex; gap:10px; margin-bottom:12px; align-items:center;";
    
    // Generowanie HTML opcji (optgroup)
    const categories = [...new Set(exercisesCache.map(ex => ex.category))];
    let optionsHtml = '<option value="">Wybierz ćwiczenie...</option>';
    
    categories.forEach(cat => {
        optionsHtml += `<optgroup label="${cat}">`;
        exercisesCache.filter(ex => ex.category === cat).forEach(ex => {
            optionsHtml += `<option value="${ex.id}">${ex.name}</option>`;
        });
        optionsHtml += `</optgroup>`;
    });

    div.innerHTML = `
        <select class="ex-id" style="flex:2; padding:12px; border-radius:12px; border:1px solid #d1d1d6; background:#fff; font-size:14px;">
            ${optionsHtml}
        </select>
        <input type="number" class="ex-sets" value="3" style="flex:0.6; margin:0; padding:12px; text-align:center;">
        <button type="button" class="remove-row-btn" style="background:none; border:none; color:#ff453a; font-size:22px; padding:0 5px;">✕</button>
    `;

    // Obsługa usuwania wiersza
    div.querySelector('.remove-row-btn').onclick = () => div.remove();
    
    setupArea.appendChild(div);
};

window.saveFullPlan = async () => {
    const nameInput = document.getElementById("new-plan-name");
    const planName = nameInput.value.trim();
    if (!planName) return alert("Podaj nazwę planu");

    const rows = document.querySelectorAll(".exercise-row-setup");
    const selections = [];
    rows.forEach(row => {
        const id = row.querySelector(".ex-id").value;
        const sets = parseInt(row.querySelector(".ex-sets").value);
        if (id && sets) selections.push({ id, sets });
    });

    if (selections.length === 0) return alert("Dodaj przynajmniej jedno ćwiczenie");

    const saveBtn = document.getElementById('save-plan-btn');
    saveBtn.innerText = "Zapisywanie...";
    saveBtn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/plans`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ name: planName, user_id: parseInt(state.currentUserId) })
        });
        
        const planData = await res.json();
        for (const s of selections) {
            await fetch(`${API_URL}/plan-exercises`, {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({ plan_id: planData.id, exercise_id: parseInt(s.id), target_sets: s.sets })
            });
        }
        location.reload();
    } catch (e) {
        alert("Błąd zapisu");
        saveBtn.innerText = "Zapisz Trening";
        saveBtn.disabled = false;
    }
};