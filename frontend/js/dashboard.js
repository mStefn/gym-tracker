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

        const buildVisualReadiness = (readinessObj) => {
            const safeR = readinessObj || {};
            
            // Sztywne kolory dla Mapy (Niezależne od styli CSS)
            const getColor = (cat) => {
                const val = safeR[cat] !== undefined ? safeR[cat] : 100;
                if (val <= 15) return '#ff3b30'; // Czerwony - Zmęczony
                if (val <= 50) return '#ff9500'; // Pomarańczowy - Regeneracja
                if (val <= 85) return '#ffcc00'; // Żółty - Gotowy
                return '#32d74b';                // Zielony - Pełna moc
            };

            return `
                <div style="display: flex; justify-content: space-around; font-size: 13px; font-weight: 800; color: #a1a1aa; letter-spacing: 2px;">
                    <span>FRONT</span>
                    <span>BACK</span>
                </div>
                
                <div style="display: flex; justify-content: center; padding: 15px 0;">
                    <svg viewBox="0 0 200 150" style="height: 180px; width: 100%; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));">
                        
                        <g transform="translate(0, 0)">
                            <circle cx="50" cy="15" r="8" fill="rgba(255,255,255,0.05)" stroke="#0b101e" stroke-width="1"/>
                            <rect x="47" y="22" width="6" height="5" fill="rgba(255,255,255,0.05)" />
                            
                            <path d="M35 25 Q50 22 65 25 L70 35 Q50 30 30 35 Z" fill="${getColor('Shoulders')}" stroke="#0b101e" stroke-width="1.5"/>
                            <path d="M38 35 Q50 40 62 35 L60 50 Q50 55 40 50 Z" fill="${getColor('Chest')}" stroke="#0b101e" stroke-width="1.5"/>
                            <path d="M40 50 Q50 55 60 50 L56 75 Q50 80 44 75 Z" fill="${getColor('Abs')}" stroke="#0b101e" stroke-width="1.5"/>
                            
                            <path d="M30 35 L22 55 L28 58 L35 45 Z" fill="${getColor('Biceps')}" stroke="#0b101e" stroke-width="1.5"/>
                            <path d="M70 35 L78 55 L72 58 L65 45 Z" fill="${getColor('Biceps')}" stroke="#0b101e" stroke-width="1.5"/>
                            
                            <path d="M44 75 L35 110 L45 110 L48 78 Z" fill="${getColor('Quads')}" stroke="#0b101e" stroke-width="1.5"/>
                            <path d="M56 75 L65 110 L55 110 L52 78 Z" fill="${getColor('Quads')}" stroke="#0b101e" stroke-width="1.5"/>
                            
                            <path d="M35 112 L32 135 L42 135 L45 112 Z" fill="rgba(255,255,255,0.05)" stroke="#0b101e" stroke-width="1.5"/>
                            <path d="M65 112 L68 135 L58 135 L55 112 Z" fill="rgba(255,255,255,0.05)" stroke="#0b101e" stroke-width="1.5"/>
                        </g>

                        <g transform="translate(100, 0)">
                            <circle cx="50" cy="15" r="8" fill="rgba(255,255,255,0.05)" stroke="#0b101e" stroke-width="1"/>
                            <rect x="47" y="22" width="6" height="5" fill="rgba(255,255,255,0.05)" />
                            
                            <path d="M35 25 Q50 22 65 25 L70 35 Q50 30 30 35 Z" fill="${getColor('Shoulders')}" stroke="#0b101e" stroke-width="1.5"/>
                            <path d="M38 35 Q50 40 62 35 L60 60 Q50 65 40 60 Z" fill="${getColor('Back')}" stroke="#0b101e" stroke-width="1.5"/>
                            <path d="M40 60 Q50 65 60 60 L58 75 Q50 80 42 75 Z" fill="${getColor('Glutes')}" stroke="#0b101e" stroke-width="1.5"/>
                            
                            <path d="M30 35 L22 55 L28 58 L35 45 Z" fill="${getColor('Triceps')}" stroke="#0b101e" stroke-width="1.5"/>
                            <path d="M70 35 L78 55 L72 58 L65 45 Z" fill="${getColor('Triceps')}" stroke="#0b101e" stroke-width="1.5"/>
                            
                            <path d="M42 75 L35 110 L45 110 L48 78 Z" fill="${getColor('Hamstrings')}" stroke="#0b101e" stroke-width="1.5"/>
                            <path d="M58 75 L65 110 L55 110 L52 78 Z" fill="${getColor('Hamstrings')}" stroke="#0b101e" stroke-width="1.5"/>
                            
                            <path d="M35 112 L32 135 L42 135 L45 112 Z" fill="${getColor('Calves')}" stroke="#0b101e" stroke-width="1.5"/>
                            <path d="M65 112 L68 135 L58 135 L55 112 Z" fill="${getColor('Calves')}" stroke="#0b101e" stroke-width="1.5"/>
                        </g>

                    </svg>
                </div>
                
                <div style="display: flex; justify-content: space-between; font-size: 10px; color: #a1a1aa; margin-top: 10px; background: rgba(0,0,0,0.4); padding: 12px; border-radius: 12px; border: 1px solid var(--border);">
                    <div style="display: flex; align-items: center; gap: 5px; font-weight: bold;"><div style="width:12px; height:12px; border-radius:3px; background:#32d74b; box-shadow: 0 0 5px #32d74b;"></div> Fresh</div>
                    <div style="display: flex; align-items: center; gap: 5px; font-weight: bold;"><div style="width:12px; height:12px; border-radius:3px; background:#ffcc00; box-shadow: 0 0 5px #ffcc00;"></div> Good</div>
                    <div style="display: flex; align-items: center; gap: 5px; font-weight: bold;"><div style="width:12px; height:12px; border-radius:3px; background:#ff9500; box-shadow: 0 0 5px #ff9500;"></div> Sore</div>
                    <div style="display: flex; align-items: center; gap: 5px; font-weight: bold;"><div style="width:12px; height:12px; border-radius:3px; background:#ff3b30; box-shadow: 0 0 5px #ff3b30;"></div> Dead</div>
                </div>
            `;
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

        const currentExp = stats.exp || 0;
        const currentLevel = stats.level || 1;
        const expTarget = stats.exp_target || 1000;
        const progressPercent = Math.min((currentExp / expTarget) * 100, 100);

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 15px; padding-bottom: 20px;">
                
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <h2 style="margin: 0;">Dashboard</h2>
                    <div style="background: rgba(255, 149, 0, 0.15); color: var(--success); padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 13px; border: 1px solid rgba(255,149,0,0.3); box-shadow: 0 0 10px rgba(255,149,0,0.2);">LEVEL ${currentLevel}</div>
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