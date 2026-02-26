const API_URL = `http://${window.location.hostname}:5001`;
let currentUserId = localStorage.getItem('selectedUserId');
let currentUserName = localStorage.getItem('selectedUserName');

window.onload = () => {
    if (!currentUserId) {
        showUserSelection();
    } else {
        loadUserDashboard();
    }
};

function logout() {
    localStorage.clear();
    location.reload();
}

async function showUserSelection() {
    const container = document.getElementById("exercises");
    container.innerHTML = "<h1 style='margin-top:40px'>Kto trenuje?</h1><div id='user-list' style='display:flex; flex-direction:column; gap:15px; margin-top:30px'></div>";
    
    try {
        const res = await fetch(`${API_URL}/users`);
        const users = await res.json();
        const list = document.getElementById("user-list");
        
        users.forEach(user => {
            const btn = document.createElement("button");
            btn.className = "save-btn";
            btn.style.padding = "20px";
            btn.style.fontSize = "18px";
            btn.innerText = user.name;
            btn.onclick = () => {
                localStorage.setItem('selectedUserId', user.id);
                localStorage.setItem('selectedUserName', user.name);
                currentUserId = user.id;
                location.reload();
            };
            list.appendChild(btn);
        });
    } catch (e) {
        container.innerHTML = "<p style='text-align:center; color:red'>Błąd połączenia z bazą danych.</p>";
    }
}

async function loadUserDashboard() {
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
            <h2 style="margin:0">Cześć, ${currentUserName}!</h2>
            <button onclick="logout()" style="color:var(--primary); background:none; border:none; font-weight:600">Zmień profil</button>
        </div>
        <div id='plans-list'></div>
    `;
    
    const res = await fetch(`${API_URL}/plans/${currentUserId}`);
    const plans = await res.json();
    const list = document.getElementById("plans-list");
    
    plans.forEach(plan => {
        const btn = document.createElement("button");
        btn.className = "save-btn";
        btn.style.marginBottom = "15px";
        btn.style.backgroundColor = "var(--primary)";
        btn.innerText = `Rozpocznij: ${plan.name}`;
        btn.onclick = () => loadPlan(plan.id, plan.name);
        list.appendChild(btn);
    });
}

async function loadPlan(planId, planName) {
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="display:flex; align-items:center; margin-bottom:20px">
            <button onclick="loadUserDashboard()" style="background:none; border:none; font-size:20px; margin-right:10px">←</button>
            <h2 style="margin:0">${planName}</h2>
        </div>
        <div id='plan-content'></div>
    `;
    
    const res = await fetch(`${API_URL}/plan-exercises/${planId}`);
    const exercises = await res.json();
    const content = document.getElementById("plan-content");

    for (const ex of exercises) {
        const div = document.createElement("div");
        div.className = "exercise-card";
        div.innerHTML = `<h3>${ex.name}</h3><div id="ex-${ex.id}"></div>`;
        content.appendChild(div);
        
        const tbody = document.getElementById(`ex-${ex.id}`);
        for (let i = 1; i <= ex.sets; i++) {
            const lastRes = await fetch(`${API_URL}/last/${currentUserId}/${ex.id}/${i}`);
            const last = await lastRes.json();
            
            const row = document.createElement("div");
            row.className = "set-row";
            row.innerHTML = `
                <div style="font-weight:bold; color:var(--primary)">S${i}</div>
                <div><span class="label-small">Poprzednio</span><span class="history-val" id="hist-${ex.id}-${i}">${last.reps} x ${last.weight}kg</span></div>
                <div><span class="label-small">Reps</span><input type="number" inputmode="numeric" id="reps-${ex.id}-${i}" placeholder="0"></div>
                <div><span class="label-small">Kg</span><input type="number" inputmode="decimal" id="weight-${ex.id}-${i}" placeholder="0"></div>
                <div style="grid-column: span 4"><button class="save-btn" onclick="logSet(this, ${ex.id}, ${i})">Zapisz Serię</button></div>
            `;
            tbody.appendChild(row);
        }
    }
}

async function logSet(btn, exId, setNumber) {
    const repsInput = document.getElementById(`reps-${exId}-${setNumber}`);
    const weightInput = document.getElementById(`weight-${exId}-${setNumber}`);
    const reps = parseInt(repsInput.value);
    const weight = parseFloat(weightInput.value.replace(',', '.'));

    if (isNaN(reps) || isNaN(weight)) return alert("Wpisz dane!");

    const res = await fetch(`${API_URL}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: parseInt(currentUserId), exercise_id: exId, set_number: setNumber, reps, weight })
    });

    if (res.ok) {
        document.getElementById(`hist-${exId}-${setNumber}`).innerText = `${reps} x ${weight}kg`;
        btn.innerText = "OK ✓";
        btn.style.background = "var(--success)";
        setTimeout(() => { btn.innerText = "Zapisz Serię"; btn.style.background = ""; }, 2000);
    }
}