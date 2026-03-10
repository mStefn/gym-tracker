import { state, API_URL, authFetch } from './state.js';

export async function renderDashboard() {
    const container = document.getElementById("exercises");
    container.innerHTML = `<div class="spinner" style="margin-top: 50px;"></div>`;

    try {
        const statsRes = await authFetch(`${API_URL}/dashboard/${state.currentUserId}`);
        const stats = await statsRes.json();

        const latestWeight = stats.weights && stats.weights.length > 0 ? stats.weights[0] : '--';

        // --- 1. TREND LINE (Waga) ---
        const buildSparkline = (weights) => {
            if (!weights || weights.length < 2) {
                return `<div style="height: 40px; display: flex; align-items: center; justify-content: center; color: #8e8e93; font-size: 11px;">Log co najmniej 2 wag by zobaczyć trend</div>`;
            }
            const data = [...weights].reverse();
            const min = Math.min(...data);
            const max = Math.max(...data);
            const range = max - min === 0 ? 1 : max - min;
            const padding = range * 0.2; 
            const paddedMin = min - padding;
            const paddedRange = (max + padding) - paddedMin;
            const width = 100; const height = 40;
            const points = data.map((w, i) => {
                const x = (i / (data.length - 1)) * width;
                const y = height - ((w - paddedMin) / paddedRange) * height;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            });
            const fillPoints = `0,${height} ${points.join(' ')} ${width},${height}`;
            return `
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" style="width: 100%; height: 40px; margin-top: 15px; overflow: visible;">
                    <defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="var(--primary)" stop-opacity="0.3"/><stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/></linearGradient></defs>
                    <polygon points="${fillPoints}" fill="url(#g)" />
                    <polyline points="${points.join(' ')}" fill="none" stroke="var(--primary)" stroke-width="2" />
                </svg>`;
        };

        // --- 2. PROFESSIONAL ANATOMY HEATMAP ---
        const buildVisualReadiness = (readinessObj) => {
            const safeR = readinessObj || {};
            const getColor = (cat) => {
                const val = safeR[cat] !== undefined ? safeR[cat] : 100;
                if (val <= 15) return '#ff3b30'; // Czerwony
                if (val <= 50) return '#ff9500'; // Pomarańczowy
                if (val <= 85) return '#ffcc00'; // Żółty
                return '#32d74b';                // Zielony (Fresh)
            };

            return `
                <div style="display: flex; justify-content: space-around; font-size: 11px; font-weight: 900; color: #555; letter-spacing: 3px; margin-bottom: 10px;">
                    <span>FRONT</span>
                    <span>BACK</span>
                </div>
                
                <div style="display: flex; justify-content: center; gap: 20px;">
                    <svg viewBox="0 0 240 180" style="width: 100%; max-width: 450px; height: auto;">
                        
                        <g transform="translate(20, 5)">
                            <path d="M45 15 Q50 5 55 15 L50 25 Z" fill="#222" /> <path d="M30 30 Q50 25 70 30 L75 40 Q50 35 25 40 Z" fill="${getColor('Shoulders')}" stroke="#0b101e" />
                            <path d="M34 40 L50 43 L50 58 L32 55 Z" fill="${getColor('Chest')}" stroke="#0b101e" />
                            <path d="M66 40 L50 43 L50 58 L68 55 Z" fill="${getColor('Chest')}" stroke="#0b101e" />
                            <path d="M25 40 L18 65 L26 68 L32 40 Z" fill="${getColor('Biceps')}" stroke="#0b101e" />
                            <path d="M75 40 L82 65 L74 68 L68 40 Z" fill="${getColor('Biceps')}" stroke="#0b101e" />
                            <rect x="42" y="60" width="7" height="8" rx="1" fill="${getColor('Abs')}" stroke="#0b101e" />
                            <rect x="51" y="60" width="7" height="8" rx="1" fill="${getColor('Abs')}" stroke="#0b101e" />
                            <rect x="42" y="70" width="7" height="8" rx="1" fill="${getColor('Abs')}" stroke="#0b101e" />
                            <rect x="51" y="70" width="7" height="8" rx="1" fill="${getColor('Abs')}" stroke="#0b101e" />
                            <rect x="42" y="80" width="7" height="8" rx="1" fill="${getColor('Abs')}" stroke="#0b101e" />
                            <rect x="51" y="80" width="7" height="8" rx="1" fill="${getColor('Abs')}" stroke="#0b101e" />
                            <path d="M41 90 L32 140 L46 140 L50 90 Z" fill="${getColor('Quads')}" stroke="#0b101e" />
                            <path d="M59 90 L68 140 L54 140 L50 90 Z" fill="${getColor('Quads')}" stroke="#0b101e" />
                        </g>

                        <g transform="translate(130, 5)">
                            <path d="M45 15 Q50 5 55 15 L50 25 Z" fill="#222" /> <path d="M30 30 Q50 20 70 30 L65 55 Q50 60 35 55 Z" fill="${getColor('Back')}" stroke="#0b101e" />
                            <path d="M25 40 L18 65 L26 68 L32 40 Z" fill="${getColor('Triceps')}" stroke="#0b101e" />
                            <path d="M75 40 L82 65 L74 68 L68 40 Z" fill="${getColor('Triceps')}" stroke="#0b101e" />
                            <path d="M35 80 Q50 95 65 80 L62 95 Q50 100 38 95 Z" fill="${getColor('Glutes')}" stroke="#0b101e" />
                            <path d="M38 98 L32 140 L44 140 L46 98 Z" fill="${getColor('Hamstrings')}" stroke="#0b101e" />
                            <path d="M62 98 L68 140 L56 140 L54 98 Z" fill="${getColor('Hamstrings')}" stroke="#0b101e" />
                            <path d="M32 142 L28 170 L42 170 L44 142 Z" fill="${getColor('Calves')}" stroke="#0b101e" />
                            <path d="M68 142 L72 170 L58 170 L56 142 Z" fill="${getColor('Calves')}" stroke="#0b101e" />
                        </g>
                    </svg>
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 10px; color: #a1a1aa; margin-top: 10px; background: rgba(0,0,0,0.4); padding: 12px; border-radius: 12px; border: 1px solid var(--border);">
                    <div style="display:flex; align-items:center; gap:5px;"><div style="width:12px; height:12px; border-radius:3px; background:#32d74b;"></div> FRESH</div>
                    <div style="display:flex; align-items:center; gap:5px;"><div style="width:12px; height:12px; border-radius:3px; background:#ffcc00;"></div> GOOD</div>
                    <div style="display:flex; align-items:center; gap:5px;"><div style="width:12px; height:12px; border-radius:3px; background:#ff9500;"></div> SORE</div>
                    <div style="display:flex; align-items:center; gap:5px;"><div style="width:12px; height:12px; border-radius:3px; background:#ff3b30;"></div> DEAD</div>
                </div>
            `;
        };

        const buildHeatmap = (activeDates) => {
            const safeDates = activeDates || [];
            let squares = '';
            for(let i = 44; i >= 0; i--) {
                const d = new Date(); d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const isActive = safeDates.includes(dateStr);
                squares += `<div style="width: 12px; height: 12px; border-radius: 2px; background: ${isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)'};"></div>`;
            }
            return squares;
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
                const d = new Date(); d.setDate(d.getDate() - (i * 7));
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
                return `
                    <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
                        <div style="height: 60px; width: 100%; display:flex; align-items:flex-end; justify-content:center; margin-bottom: 5px;">
                            <div style="width: 20px; height: ${Math.max(height, 2)}%; background: var(--primary); border-radius: 4px; opacity: ${height === 100 ? '1' : '0.4'};"></div>
                        </div>
                        <span style="font-size: 10px; color: #8e8e93;">${displayVol}</span>
                    </div>`;
            }).join('');
        };

        const currentExp = stats.exp || 0;
        const currentLevel = stats.level || 1;
        const progressPercent = Math.min((currentExp / 1000) * 100, 100);

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 15px; padding-bottom: 20px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <h2 style="margin: 0;">Dashboard</h2>
                    <div style="background: rgba(255, 149, 0, 0.15); color: var(--success); padding: 5px 12px; border-radius: 20px; font-weight: 800; font-size: 13px; border: 1px solid rgba(255,149,0,0.3);">LVL ${currentLevel}</div>
                </div>
                
                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 20px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <h3 style="margin: 0 0 5px 0; color: var(--primary); font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">EXP Postęp</h3>
                    <div style="font-size: 28px; font-weight: 900; margin-bottom: 15px;">${currentExp} <span style="font-size: 14px; color: #555;">/ 1000 XP</span></div>
                    <div style="width: 100%; height: 10px; background: rgba(0,0,0,0.6); border-radius: 10px; overflow: hidden;">
                        <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--success));"></div>
                    </div>
                </div>

                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #8e8e93; font-size: 11px; text-transform: uppercase;">Waga Trend</h4>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="font-size: 22px; font-weight: 800;">${latestWeight}<span style="font-size: 12px; color: #555;"> kg</span></div>
                        <div style="display:flex; gap: 8px;">
                            <input type="number" id="weight-input" placeholder="0.0" style="width: 55px; padding: 8px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.3); color: #fff;">
                            <button onclick="window.logWeight()" style="background: var(--primary); color: #000; border: none; border-radius: 8px; font-weight: 800; padding: 0 12px; cursor: pointer;">LOG</button>
                        </div>
                    </div>
                    ${buildSparkline(stats.weights)}
                </div>

                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 20px;">
                    <h4 style="margin: 0 0 15px 0; color: #8e8e93; font-size: 11px; text-transform: uppercase;">Mapa Mięśni (Regeneracja)</h4>
                    ${buildVisualReadiness(stats.readiness)}
                </div>

                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #8e8e93; font-size: 11px; text-transform: uppercase;">Aktywność (45 dni)</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;">
                        ${buildHeatmap(stats.heatmap)}
                    </div>
                </div>

                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #8e8e93; font-size: 11px; text-transform: uppercase;">Objętość (4 tyg)</h4>
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%; padding-top: 10px;">
                        ${buildVolume(stats.volume)}
                    </div>
                </div>
            </div>
        `;

    } catch (e) {
        console.error(e);
        container.innerHTML = `<p style="color:var(--danger); text-align:center;">Błąd synchronizacji.</p>`;
    }
}

window.logWeight = async () => {
    const w = parseFloat(document.getElementById("weight-input").value);
    if (!w || w <= 0) return;
    try {
        await authFetch(`${API_URL}/weight`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ user_id: parseInt(state.currentUserId), weight: w })
        });
        renderDashboard(); 
    } catch(e) { console.error(e); }
};