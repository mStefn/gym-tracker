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
                return `<div style="height: 40px; display: flex; align-items: center; justify-content: center; color: #8e8e93; font-size: 11px;">Log at least 2 weights to see trend</div>`;
            }

            const data = [...weights].reverse();
            const min = Math.min(...data);
            const max = Math.max(...data);
            const range = max - min === 0 ? 1 : max - min;
            const padding = range * 0.2; 
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

        // --- 2. HEATMAP (Aktywność - kwadraciki) ---
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

        // --- 3. VOLUME (Objętość - słupki) ---
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

        // --- 4. MUSCLE READINESS (Modele SVG Przód i Tył) ---
        const buildVisualReadiness = (readinessObj) => {
            const safeR = readinessObj || {};
            
            const getColor = (cat) => {
                const val = safeR[cat] !== undefined ? safeR[cat] : 100;
                if (val <= 15) return '#ff3b30'; // Czerwony - Zmęczony (Dead)
                if (val <= 50) return '#ff9500'; // Pomarańczowy - W trakcie regeneracji (Sore)
                if (val <= 85) return '#ffcc00'; // Żółty - Gotowy (Good)
                return '#32d74b';                // Zielony - Pełna moc (Fresh)
            };

            return `
                <div style="display: flex; justify-content: space-around; font-size: 11px; font-weight: 900; color: #a1a1aa; letter-spacing: 3px; margin-bottom: 10px;">
                    <span>FRONT</span>
                    <span>BACK</span>
                </div>
                
                <div style="display: flex; justify-content: center; gap: 20px; padding-bottom: 10px;">
                    <svg viewBox="0 0 220 180" style="width: 100%; max-width: 400px; height: auto; filter: drop-shadow(0 0 15px rgba(0,0,0,0.4));">
                        
                        <g transform="translate(10, 5)">
                            <ellipse cx="50" cy="12" rx="7" ry="9" fill="rgba(255,255,255,0.05)" stroke="#0b101e" stroke-width="1.5" />
                            <rect x="47" y="21" width="6" height="5" fill="rgba(255,255,255,0.05)" />
                            
                            <path d="M32 28 Q50 24 68 28 L74 38 Q50 34 26 38 Z" fill="${getColor('Shoulders')}" stroke="#0b101e" stroke-width="1.5" />
                            <path d="M35 38 Q50 42 65 38 L63 55 Q50 60 37 55 Z" fill="${getColor('Chest')}" stroke="#0b101e" stroke-width="1.5" />
                            <path d="M26 38 L18 60 L26 62 L32 38 Z" fill="${getColor('Biceps')}" stroke="#0b101e" stroke-width="1.5" />
                            <path d="M74 38 L82 60 L74 62 L68 38 Z" fill="${getColor('Biceps')}" stroke="#0b101e" stroke-width="1.5" />
                            <path d="M40 57 L60 57 L57 85 L43 85 Z" fill="${getColor('Abs')}" stroke="#0b101e" stroke-width="1.5" />
                            <path d="M43 88 L32 140 L46 140 L50 90 Z" fill="${getColor('Quads')}" stroke="#0b101e" stroke-width="1.5" />
                            <path d="M57 88 L68 140 L54 140 L50 90 Z" fill="${getColor('Quads')}" stroke="#0b101e" stroke-width="1.5" />
                            <path d="M32 142 L30 170 L42 170 L46 142 Z" fill="rgba(255,255,255,0.05)" stroke="#0b101e" stroke-width="1.5" />
                            <path d="M68 142 L70 170 L58 170 L54 142 Z" fill="rgba(255,255,255,0.05)" stroke="#0b101e" stroke-width="1.5" />
                        </g>

                        <g transform="translate(120, 5)">
                            <ellipse cx="50" cy="12" rx="7" ry="9" fill="rgba(255,255,255,0.05)" stroke="#0b101e" stroke-width="1.5" />
                            <rect x="47" y="21" width="6" height="5" fill="rgba(255,255,255,0.05)" />
                            
                            <path d="M32 28 Q50 24 68 28 L72 50 Q50 55 28 50 Z" fill="${getColor('Back')}" stroke="#0b101e" stroke-width="1.5" />
                            <path d="M26 38 L18 60 L26 62 L32 38 Z" fill="${getColor('Triceps')}" stroke="#0b101e" stroke-width="1.5" />
                            <path d="M74 38 L82 60 L74 62 L68 38 Z" fill="${getColor('Triceps')}" stroke="#0b101e" stroke-width="1.5" />
                            <path d="M35 75 Q50 85 65 75 L62 95 Q50 100 38 95 Z" fill="${getColor('Glutes')}" stroke="#0b101e" stroke-width="1.5" />
                            <path d="M38 98 L32 140 L44 140 L46 98 Z" fill="${getColor('Hamstrings')}" stroke="#0b101e" stroke-width="1.5" />
                            <path d="M62 98 L68 140 L56 140 L54 98 Z" fill="${getColor('Hamstrings')}" stroke="#0b101e" stroke-width="1.5" />
                            <path d="M32 142 L28 170 L42 170 L44 142 Z" fill="${getColor('Calves')}" stroke="#0b101e" stroke-width="1.5" />
                            <path d="M68 142 L72 170 L58 170 L56 142 Z" fill="${getColor('Calves')}" stroke="#0b101e" stroke-width="1.5" />
                        </g>

                    </svg>
                </div>
                
                <div style="display: flex; justify-content: space-between; font-size: 10px; color: #a1a1aa; margin-top: 10px; background: rgba(0,0,0,0.4); padding: 12px; border-radius: 12px; border: 1px solid var(--border);">
                    <div style="display: flex; align-items: center; gap: 5px; font-weight: bold;"><div style="width:12px; height:12px; border-radius:3px; background:#32d74b; box-shadow: 0 0 5px #32d74b;"></div> FRESH</div>
                    <div style="display: flex; align-items: center; gap: 5px; font-weight: bold;"><div style="width:12px; height:12px; border-radius:3px; background:#ffcc00; box-shadow: 0 0 5px #ffcc00;"></div> GOOD</div>
                    <div style="display: flex; align-items: center; gap: 5px; font-weight: bold;"><div style="width:12px; height:12px; border-radius:3px; background:#ff9500; box-shadow: 0 0 5px #ff9500;"></div> SORE</div>
                    <div style="display: flex; align-items: center; gap: 5px; font-weight: bold;"><div style="width:12px; height:12px; border-radius:3px; background:#ff3b30; box-shadow: 0 0 5px #ff3b30;"></div> DEAD</div>
                </div>
            `;
        };

        // --- GŁÓWNY RENDER KONTENERA ---
        const currentExp = stats.exp || 0;
        const currentLevel = stats.level || 1;
        const expTarget = 1000;
        const progressPercent = Math.min((currentExp / expTarget) * 100, 100);

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 15px; padding-bottom: 20px;">
                
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <h2 style="margin: 0;">Dashboard</h2>
                    <div style="background: rgba(255, 149, 0, 0.15); color: var(--success); padding: 5px 12px; border-radius: 20px; font-weight: 800; font-size: 13px; border: 1px solid rgba(255,149,0,0.3); box-shadow: 0 0 10px rgba(255,149,0,0.2);">LEVEL ${currentLevel}</div>
                </div>
                
                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 20px; text-align: center; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <h3 style="margin: 0 0 5px 0; color: var(--primary); font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Experience Points</h3>
                    <div style="font-size: 28px; font-weight: 900; margin-bottom: 15px; text-shadow: 0 0 15px var(--primary-glow);">${currentExp} <span style="font-size: 14px; color: #8e8e93;">/ ${expTarget}</span></div>
                    
                    <div style="width: 100%; height: 10px; background: rgba(0,0,0,0.6); border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--success)); box-shadow: 0 0 10px var(--success); transition: width 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);"></div>
                    </div>
                </div>

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
                    ${buildVisualReadiness(stats.readiness)}
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