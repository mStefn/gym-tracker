const API_URL = `http://${window.location.hostname}:5001`;

async function adminLogin() {
    const pass = document.getElementById("admin-pass").value;
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({name: "admin", pin: pass})
    });

    if (res.ok) {
        document.getElementById("login-zone").style.display = "none";
        document.getElementById("console-zone").style.display = "block";
        loadUsers();
    } else {
        alert("Access Denied");
    }
}

async function loadUsers() {
    const res = await fetch(`${API_URL}/admin/users`);
    const users = await res.json();
    const list = document.getElementById("user-list");
    list.innerHTML = users.map(u => `
        <div class="admin-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${u.name} ${u.is_admin ? '(System)' : ''}</strong>
                ${!u.is_admin ? `<button onclick="deleteUser(${u.id})" style="background:#ff453a; border:none; color:white; padding:5px 10px; border-radius:5px;">Delete</button>` : ''}
            </div>
            ${!u.is_admin ? `
            <div style="margin-top:10px; display:flex; gap:10px;">
                <input type="text" id="res-${u.id}" placeholder="New 4-digit PIN" style="margin:0; flex:1;">
                <button onclick="resetPin(${u.id})" style="background:#0a84ff; border:none; color:white; padding:0 15px; border-radius:8px;">Reset</button>
            </div>` : ''}
        </div>
    `).join('');
}

async function resetPin(id) {
    const pin = document.getElementById(`res-${id}`).value;
    if(pin.length !== 4) return alert("PIN must be 4 digits");
    await fetch(`${API_URL}/admin/reset-pin`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user_id: id, new_pin: pin})
    });
    alert("PIN updated");
}

async function deleteUser(id) {
    if(confirm("Delete user and all their workout history?")) {
        await fetch(`${API_URL}/user/${id}`, { method: "DELETE" });
        loadUsers();
    }
}