const API_URL = "http://localhost:3000";

async function loadCategory(category) {
  const res = await fetch(`${API_URL}/exercises/${encodeURIComponent(category)}`);
  const exercises = await res.json();

  const container = document.getElementById("exercises");
  container.innerHTML = ""; // wyczyść poprzednie

  exercises.forEach(ex => {
    const div = document.createElement("div");
    div.innerHTML = `<h3>${ex.name} (${ex.sets} series)</h3>
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
        <tbody id="exercise-${ex.id}">
        </tbody>
      </table>`;
    container.appendChild(div);
    loadExerciseLog(ex.id, ex.sets);
  });
}

async function loadExerciseLog(exId, sets) {
  const tbody = document.getElementById(`exercise-${exId}`);

  // pobierz ostatni wynik
  const lastRes = await fetch(`${API_URL}/last/${exId}`);
  const last = await lastRes.json();

  for (let i = 1; i <= sets; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i}</td>
      <td>${last.set_number || '-'}</td>
      <td>${last.weight || '-'}</td>
      <td><input type="number" id="reps-${exId}-${i}" /></td>
      <td><input type="number" id="weight-${exId}-${i}" /></td>
      <td><button onclick="logSet(${exId}, ${i})">Save</button></td>
    `;
    tbody.appendChild(tr);
  }
}

async function logSet(exId, setNumber) {
  const reps = parseInt(document.getElementById(`reps-${exId}-${setNumber}`).value);
  const weight = parseFloat(document.getElementById(`weight-${exId}-${setNumber}`).value);

  if (!reps || !weight) {
    alert("Enter reps and weight");
    return;
  }

  const res = await fetch(`${API_URL}/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exercise_id: exId, set_number: setNumber, reps, weight })
  });

  const data = await res.json();
  if (data.status === "ok") {
    alert("Logged!");
  } else {
    alert("Error: " + data.error);
  }
}