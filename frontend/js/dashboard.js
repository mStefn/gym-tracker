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
            
            // Poprawiona logika: wszystko powyżej/równe 80 to zielony (100% gotowości)
            const getColor = (cat) => {
                const val = safeR[cat] !== undefined ? safeR[cat] : 100;
                if (val < 40) return 'var(--danger)';
                if (val < 80) return 'orange';
                return 'var(--success)';
            };

            return `
                <div style="display: flex; justify-content: center; padding: 10px 0;">
                    <svg viewBox="0 0 100 150" style="height: 180px; width: 100%; filter: drop-shadow(0 0 10px rgba(0,210,255,0.15));">
                        <circle cx="50" cy="15" r="10" fill="rgba(255,255,255,0.05)" stroke="var(--border)" stroke-width="1"/>
                        <rect x="47" y="25" width="6" height="10" fill="rgba(255,255,255,0.05)" />
                        <path d="M 30 35 Q 50 30 70 35 L 75 45 Q 50 40 25 45 Z" fill="${getColor('Shoulders')}" stroke="#0b101e" stroke-width="2"/>
                        <path d="M 32 45 Q 50 50 68 45 L 65 65 Q 50 70 35 65 Z" fill="${getColor('Chest')}" stroke="#0b101e" stroke-width="2"/>
                        <path d="M 25 45 L 32 45 L 35 65 L 28 80 Z" fill="${getColor('Back')}" stroke="#0b101e" stroke-width="2"/>
                        <path d="M 75 45 L 68 45 L 65 65 L 72 80 Z" fill="${getColor('Back')}" stroke="#0b101e" stroke-width="2"/>
                        <path d="M 35 65 Q 50 70 65 65 L 60 90 Q 50 95 40 90 Z" fill="${getColor('Abs')}" stroke="#0b101e" stroke-width="2"/>
                        <path d="M 25 45 L 18 70 L 28 72 L 32 45 Z" fill="${getColor('Biceps')}" stroke="#0b101e" stroke-width="2"/>
                        <path d="M 75 45 L 82 70 L 72 72 L 68 45 Z" fill="${getColor('Biceps')}" stroke="#0b101e" stroke-width="2"/>
                        <path d="M 18 70 L 12 90 L 20 92 L 28 72 Z" fill="${getColor('Triceps')}" stroke="#0b101e" stroke-width="2"/>
                        <path d="M 82 70 L 88 90 L 80 92 L 72 72 Z" fill="${getColor('Triceps')}" stroke="#0b101e" stroke-width="2"/>
                        <path d="M 40 90 L 30 140 L 45 140 L 48 93 Z" fill="${getColor('Legs')}" stroke="#0b101e" stroke-width="2"/>
                        <path d="M 60 90 L 70 140 L 55 140 L 52 93 Z" fill="${getColor('Legs')}" stroke="#0b101e" stroke-width="2"/>
                    </svg>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 15px;">
                    ${['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Abs'].map(cat => `
                        <div style="font-size: 11px; color: #8e8e93; display: flex; align-items: center; gap: 4px; font-weight: 600; text-transform: uppercase;">
                            <div style="width:8px; height:8px; border-radius:50%; background:${getColor(cat)};"></div> ${cat}
                        </div>
                    `).join('')}
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