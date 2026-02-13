const API_URL = `http://${window.location.hostname}:5001`;

async function loadCategory(category) {
    const container = document.getElementById("exercises");
    container.innerHTML = "<p style='text-align:center; padding: 20px;'>Ładowanie planu...</p>";

    try {
        const res = await fetch(`${API_URL}/exercises/${encodeURIComponent(category)}`);
        const exercises = await res.json();
        container.innerHTML = ""; 

        if (exercises.length === 0) {
            container.innerHTML = "<p style='text-align:center;'>Brak ćwiczeń w tej kategorii.</p>";
            return;
        }

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
        container.innerHTML = `<p style='color:red; text-align:center;'>Błąd: Nie można połączyć z backendem na ${API_URL}</p>`;
    }
}

async function loadExerciseRows(exId, sets) {
    const container = document.getElementById(`exercise-${exId}`);

    for (let i = 1; i <= sets; i++) {
        try {
            const lastRes = await fetch(`${API_URL}/last/${exId}/${i}`);
            const last = await lastRes.json();

            const row = document.createElement("div");
            row.className = "set-row";
            row.innerHTML = `
                <div style="font-weight:bold; color:var(--primary)">S${i}</div>
                <div>
                    <span class="label-small">Poprzednio</span>
                    <span class="history-val" id="history-${exId}-${i}">${last.reps || 0} x ${last.weight || 0}kg</span>
                </div>
                <div>
                    <span class="label-small">Reps</span>
                    <input type="number" inputmode="numeric" pattern="[0-9]*" id="reps-${exId}-${i}" placeholder="0">
                </div>
                <div>
                    <span class="label-small">Kg</span>
                    <input type="number" inputmode="decimal" step="0.5" id="weight-${exId}-${i}" placeholder="0">
                </div>
                <div style="grid-column: span 4; margin-top: 5px;">
                    <button class="save-btn" onclick="logSet(this, ${exId}, ${i})">Zapisz Serię ${i}</button>
                </div>
            `;
            container.appendChild(row);
        } catch (e) {
            console.error("Błąd wiersza:", e);
        }
    }
}

async function logSet(btn, exId, setNumber) {
    const repsInput = document.getElementById(`reps-${exId}-${setNumber}`);
    const weightInput = document.getElementById(`weight-${exId}-${setNumber}`);
    
    const weightRaw = weightInput.value.replace(',', '.');
    const reps = parseInt(repsInput.value);
    const weight = parseFloat(weightRaw);

    if (isNaN(reps) || isNaN(weight)) {
        alert("Wpisz poprawne liczby!");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ exercise_id: exId, set_number: setNumber, reps, weight })
        });

        if (res.ok) {
            const historySpan = document.getElementById(`history-${exId}-${setNumber}`);
            if (historySpan) {
                historySpan.innerText = `${reps} x ${weight}kg`;
                historySpan.style.color = "#007AFF";
            }

            const originalText = btn.innerText;
            btn.innerText = "Zapisano! ✓";
            btn.style.background = "#34C759";
            btn.disabled = true;

            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.background = "";
                btn.disabled = false;
                if (historySpan) historySpan.style.color = "";
            }, 2000);
        }
    } catch (err) {
        alert("Błąd połączenia!");
    }
}