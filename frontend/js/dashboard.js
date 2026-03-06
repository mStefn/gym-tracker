import { state, API_URL, authFetch } from './state.js';

export async function renderDashboard() {
    const container = document.getElementById("exercises");
    container.innerHTML = `<div class="spinner" style="margin-top: 50px;"></div>`;

    try {
        const statsRes = await authFetch(`${API_URL}/dashboard/${state.currentUserId}`);
        const stats = await statsRes.json();

        const latestWeight = stats.weights && stats.weights.length > 0 ? stats.weights[0] : '--';

        const buildSparkline = (weights) => {
            if (!weights || weights.length < 2) {
                return `<div style="height: 40px; display: flex; align-items: center; justify-content: center; color: #8e8e93; font-size: 11px;">Log at least 2 weights to see trend</div>`;
            }

            const data = [...weights].reverse();
            const min = Math.min(...data);
            const max = Math.max(...data);
            const range = max - min === 0 ? 1 : max - min;
            const padding = max - min === 0 ? min * 0.05 : range * 0.2; 
            const paddedMin = min - padding;
            const paddedRange = (max + padding) - paddedMin;

            const width = 100; 
            const height = 40;

            const points = data.map((w, i) => {
                const x = (i / (data.length - 1)) * width;
                const y = height - ((w - paddedMin) / paddedRange) * height;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            });

            const fillPoints = `0,${height} ${points.join(' ')} ${width},${height}`;
            const lastY = height - ((data[data.length - 1] - paddedMin) / paddedRange) * height;

            return `
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" style="width: 100%; height: 40px; margin-top: 15px; overflow: visible;">
                    <defs>
                        <linearGradient id="sparkline-gradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.3"/>
                            <stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/>
                        </linearGradient>
                    </defs>
                    <polygon points="${fillPoints}" fill="url(#sparkline-gradient)" />
                    <polyline points="${points.join(' ')}" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <circle cx="${width}" cy="${lastY.toFixed(1)}" r="2.5" fill="var(--bg)" stroke="var(--primary)" stroke-width="1.5" />
                </svg>
            `;
        };

        const buildHeatmap = (activeDates) => {
            const safeDates = activeDates || [];
            let squares = '';
            for(let i = 44; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const isActive = safeDates.includes(dateStr);
                squares += `<div style="width: 12px; height: 12px; border-radius: 2px; background: ${isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)'};"></div>`;
            }
            return squares;
        };

        const buildReadiness = (readinessObj) => {
            const safeReadiness = readinessObj || {};
            return ['Chest', 'Back', 'Legs', 'Shoulders'].map(cat => {
                const val = safeReadiness[cat] !== undefined ? safeReadiness[cat] : 100;
                let color = 'var(--success)';
                if (val < 40) color = 'var(--danger)';
                else if (val < 80) color = 'orange';
                
                return `
                    <div style="margin-bottom: 8px;">
                        <div style="display:flex; justify-content:space-between; font-size: 11px; color:#8e8e93; margin-bottom: 3px; font-weight: 600;">
                            <span>${cat}</span><span>${val}%</span>
                        </div>
                        <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.3); border-radius: 10px; overflow: hidden;">
                            <div style="width: ${val}%; height: 100%; background: ${color}; border-radius: 10px; transition: 1s;"></div>
                        </div>
                    </div>
                `;
            }).join('');
        };

        const buildVolume = (volArray) => {
            const getYearWeek = (d) => {
                const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                const dayNum = date.getUTCDay() || 7;
                date.setUTCDate(date.getUTCDate() + 4 - dayNum);
                const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
                const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
                return `${date.getUTCFullYear()}${weekNo.toString().padStart(2, '0')}`;
            };

            const last4Weeks = [];
            for(let i = 3; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - (i * 7));
                last4Weeks.push(getYearWeek(d));
            }

            const safeVolArray = volArray || [];
            const finalData = last4Weeks.map(weekStr => {
                const found = safeVolArray.find(v => v.week === weekStr);
                return { week: weekStr, total: found ? found.total : 0 };
            });

            const maxVol = Math.max(...finalData.map(v => v.total));
            
            return finalData.map(v => {
                const height = maxVol > 0 ? (v.total / maxVol) * 100 : 0;
                const displayVol = v.total > 0 ? (v.total/1000).toFixed(1) + 'k' : '0.0k';
                const finalHeight = Math.max(height, 2); 
                const opacity = height === 100 && maxVol > 0 ? '1' : '0.4';

                return `
                    <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
                        <div style="height: 60px; width: 100%; display:flex; align-items:flex-end; justify-content:center; margin-bottom: 5px;">
                            <div style="width: 20px; height: ${finalHeight}%; background: var(--primary); border-radius: 4px; opacity: ${opacity}; transition: height 0.5s ease;"></div>
                        </div>
                        <span style="font-size: 10px; color: ${v.total > 0 ? 'var(--text)' : '#8e8e93'}; font-weight: 600;">${displayVol}</span>
                    </div>
                `;
            }).join('');
        };

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 15px; padding-bottom: 20px;">
                <h2 style="margin: 0 0 5px 0;">Home</h2>
                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #8e8e93; font-size: 12px; text-transform: uppercase;">Body Weight</h4>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="font-size: 24px; font-weight: bold; color: var(--text);">${latestWeight}<span style="font-size: 14px; color: #8e8e93;"> kg</span></div>
                        <div style="display:flex; gap: 8px;">
                            <input type="number" id="weight-input" placeholder="0.0" style="width: 60px; padding: 5px; text-align: center; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                            <button onclick="window.logWeight()" style="background: rgba(0, 210, 255, 0.1); color: var(--primary); border: none; border-radius: 8px; font-weight: bold; padding: 0 12px; cursor: pointer;">Log</button>
                        </div>
                    </div>
                    ${buildSparkline(stats.weights)}
                </div>
                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 15px;">
                    <h4 style="margin: 0 0 15px 0; color: #8e8e93; font-size: 12px; text-transform: uppercase;">Muscle Readiness</h4>
                    ${buildReadiness(stats.readiness)}
                </div>
                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #8e8e93; font-size: 12px; text-transform: uppercase;">Activity (Last 45 Days)</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;">
                        ${buildHeatmap(stats.heatmap)}
                    </div>
                </div>
                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #8e8e93; font-size: 12px; text-transform: uppercase;">Volume (Last 4 Weeks)</h4>
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%; padding-top: 10px;">
                        ${buildVolume(stats.volume)}
                    </div>
                </div>
            </div>
        `;

    } catch (e) {
        console.error("Dashboard error:", e);
        container.innerHTML = `<p style="color:var(--danger); text-align:center;">Failed to load dashboard.</p>`;
    }
}

window.logWeight = async () => {
    const w = parseFloat(document.getElementById("weight-input").value);
    if (!w || w <= 0) return alert("Enter valid weight");
    
    try {
        await authFetch(`${API_URL}/weight`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ user_id: parseInt(state.currentUserId), weight: w })
        });
        window.navigate('home'); 
    } catch(e) {
        alert("Failed to log weight");
    }
};

// --- SETTINGS ---

window.renderSettings = () => {
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="max-width: 400px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; padding-bottom: 40px;">
            <h2 style="margin-bottom: 5px;">Settings</h2>
            
            <div class="exercise-card">
                <h3 style="margin-bottom: 15px; font-size: 16px; color: var(--primary);">Security</h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <input type="password" id="old-pin" placeholder="Current PIN" style="padding: 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                    <input type="password" id="new-pin" maxlength="4" placeholder="New PIN (4 digits)" style="padding: 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                    <input type="password" id="conf-pin" maxlength="4" placeholder="Confirm New PIN" style="padding: 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                    <button onclick="window.updatePin()" class="save-btn" style="margin-top: 5px;">Update PIN</button>
                </div>
            </div>

            <div class="exercise-card">
                <h3 style="margin-bottom: 15px; font-size: 16px; color: orange;">Data Management</h3>
                <p style="font-size: 12px; color: #8e8e93; margin-bottom: 15px;">Wipe all your workout logs and volume history. Your training plans will remain intact.</p>
                <button onclick="window.clearUserHistory()" style="width: 100%; background: transparent; color: orange; border: 1px solid orange; padding: 12px; border-radius: 12px; font-weight: bold; cursor: pointer;">Clear Workout History</button>
            </div>

            <div class="exercise-card">
                <h3 style="margin-bottom: 15px; font-size: 16px; color: var(--danger);">Danger Zone</h3>
                <p style="font-size: 12px; color: #8e8e93; margin-bottom: 15px;">Permanently delete your account, plans, and all data. This action cannot be undone.</p>
                <button onclick="window.deleteUserAccount()" style="width: 100%; background: transparent; color: var(--danger); border: 1px solid var(--danger); padding: 12px; border-radius: 12px; font-weight: bold; cursor: pointer;">Delete Account</button>
            </div>
        </div>
    `;
};

window.updatePin = async () => {
    const oldPin = document.getElementById("old-pin").value;
    const newPin = document.getElementById("new-pin").value;
    const confPin = document.getElementById("conf-pin").value;

    if (newPin !== confPin) return alert("New PINs do not match");
    if (newPin.length !== 4) return alert("PIN must be exactly 4 digits");
    
    try {
        const res = await authFetch(`${API_URL}/change-pin`, {
            method: "POST", 
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({user_id: parseInt(state.currentUserId), old_pin: oldPin, new_pin: newPin})
        });
        if (res.ok) {
            alert("PIN successfully updated");
            window.navigate('settings');
        } else {
            alert("Error: Current PIN is incorrect");
        }
    } catch (e) {
        alert("Server connection error");
    }
};

window.clearUserHistory = async () => {
    const confirmation = prompt("Type 'clear' to delete all your workout logs:");
    if (confirmation !== 'clear') {
        if (confirmation !== null) alert("Action canceled: Text did not match.");
        return;
    }

    try {
        const res = await authFetch(`${API_URL}/history/${state.currentUserId}`, { method: "DELETE" });
        if (res.ok) {
            alert("Workout history cleared.");
            window.navigate('settings');
        } else {
            alert("Error clearing history.");
        }
    } catch (e) {
        alert("Server error");
    }
};

window.deleteUserAccount = async () => {
    const confirmation = prompt("Type 'delete' to permanently delete your account:");
    if (confirmation !== 'delete') {
        if (confirmation !== null) alert("Action canceled: Text did not match.");
        return;
    }

    try {
        const res = await authFetch(`${API_URL}/account/${state.currentUserId}`, { method: "DELETE" });
        if (res.ok) {
            alert("Account deleted.");
            if (window.appLogout) window.appLogout();
        } else {
            alert("Error deleting account.");
        }
    } catch (e) {
        alert("Server error");
    }
};