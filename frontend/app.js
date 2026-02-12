const API_URL = "http://192.168.1.166:5001";

async function loadCategory(category) {
    const container = document.getElementById("exercises");
    container.innerHTML = "Loading...";

    try {
        const res = await fetch(`${API_URL}/exercises/${encodeURIComponent(category)}`);
        const exercises = await res.json();
        container.innerHTML = ""; 

        for (const ex of exercises) {
            const div = document.createElement("div");
            div.className = "exercise-card";
            div.innerHTML = `
                <h3>${ex.name} (${ex.sets} series)</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Set</th>
                            <th>Last Reps</th>
                            <th>Last Weight</th>
                            <th>Reps</th>
                            <th>Weight</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="exercise-${ex.id}"></tbody>
                </table>`;
            container.appendChild(div);
            await loadExerciseRows(ex.id, ex.sets);
        }
    } catch (err) {
        container.innerHTML = "Error loading exercises. Check backend connection.";
    }
}

async function loadExerciseRows(exId, sets) {
    const tbody = document.getElementById(`exercise-${exId}`);

    for (let i = 1; i <= sets; i++) {
        // Pobieramy ostatni wynik dla konkretnej serii (set_number = i)
        const lastRes = await fetch(`${API_URL}/last/${exId}/${i}`);
        const last = await lastRes.json();

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${i}</td>
            <td style="color: gray">${last.reps || '-'}</td>
            <td style="color: gray">${last.weight ? last.weight + 'kg' : '-'}</td>
            <td><input type="number" id="reps-${exId}-${i}" placeholder="0"></td>
            <td><input type="number" step="0.5" id="weight-${exId}-${i}" placeholder="kg"></td>
            <td><button class="save-btn" onclick="logSet(${exId}, ${i})">Save</button></td>
        `;
        tbody.appendChild(tr);
    }
}

async function logSet(exId, setNumber) {
    const repsInput = document.getElementById(`reps-${exId}-${setNumber}`);
    const weightInput = document.getElementById(`weight-${exId}-${setNumber}`);
    
    const reps = parseInt(repsInput.value);
    const weight = parseFloat(weightInput.value);

    if (!reps || isNaN(weight)) {
        alert("Enter reps and weight");
        return;
    }

    const res = await fetch(`${API_URL}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            exercise_id: exId, 
            set_number: setNumber, 
            reps: reps, 
            weight: weight 
        })
    });

    if (res.ok) {
        alert(`Set ${setNumber} saved!`);
    } else {
        alert("Error saving data");
    }
}