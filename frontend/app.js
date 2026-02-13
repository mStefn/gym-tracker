const API_URL = "http://192.168.1.166:5001";

async function loadCategory(category) {
    const container = document.getElementById("exercises");
    container.innerHTML = "<p style='text-align:center'>Ładowanie...</p>";

    try {
        const res = await fetch(`${API_URL}/exercises/${encodeURIComponent(category)}`);
        const exercises = await res.json();
        container.innerHTML = ""; 

        for (const ex of exercises) {
            const div = document.createElement("div");
            div.className = "exercise-card";
            div.innerHTML = `
                <h3>${ex.name}</h3>
                <div id="exercise-${ex.id}"></div>
            `;
            container.appendChild(div);
            await loadExerciseRows(ex.id, ex.sets);
        }
    } catch (err) {
        container.innerHTML = "<p style='color:red; text-align:center'>Błąd połączenia z serwerem</p>";
    }
}

async function loadExerciseRows(exId, sets) {
    const tbody = document.getElementById(`exercise-${exId}`);

    for (let i = 1; i <= sets; i++) {
        const lastRes = await fetch(`${API_URL}/last/${exId}/${i}`);
        const last = await lastRes.json();

        const row = document.createElement("div");
        row.className = "set-row";
        row.innerHTML = `
            <div style="font-weight:bold; color:var(--primary)">S${i}</div>
            <div>
                <span class="label-small">Poprzednio</span>
                <span class="history-val">${last.reps || 0} x ${last.weight || 0}kg</span>
            </div>
            <div>
                <span class="label-small">Reps</span>
                <input type="number" pattern="[0-9]*" id="reps-${exId}-${i}" placeholder="0">
            </div>
            <div>
                <span class="label-small">Kg</span>
                <input type="number" step="0.5" id="weight-${exId}-${i}" placeholder="0">
            </div>
            <div style="grid-column: span 4; margin-top: 5px;">
                <button class="save-btn" onclick="logSet(${exId}, ${i})">Zapisz Serię ${i}</button>
            </div>
        `;
        tbody.appendChild(row);
    }
}

async function logSet(exId, setNumber) {
    const repsInput = document.getElementById(`reps-${exId}-${setNumber}`);
    const weightInput = document.getElementById(`weight-${exId}-${setNumber}`);
    
    const reps = parseInt(repsInput.value);
    const weight = parseFloat(weightInput.value);

    if (isNaN(reps) || isNaN(weight)) {
        alert("Wpisz powtórzenia i ciężar!");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ exercise_id: exId, set_number: setNumber, reps, weight })
        });

        if (res.ok) {
            // Wizualne potwierdzenie zapisu
            const btn = event.target;
            const originalText = btn.innerText;
            btn.innerText = "Zapisano! ✓";
            btn.style.background = "#28a745";
            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.background = "";
            }, 2000);
        }
    } catch (err) {
        alert("Błąd połączenia!");
    }
}