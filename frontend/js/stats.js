import { state, API_URL, authFetch } from './state.js';

export async function renderStats() {
    const container = document.getElementById("exercises");
    container.innerHTML = `<div class="spinner" style="margin-top: 50px;"></div>`;

    try {
        const res = await authFetch(`${API_URL}/stats/advanced/${state.currentUserId}`);
        const data = await res.json();

        // 1. Milestones
        const volumeStr = data.milestones.volume > 0 ? (data.milestones.volume / 1000).toFixed(1) + 'k' : '0';
        
        // 2. Hall of Fame
        let hofHtml = '<div style="color: #8e8e93; font-size: 13px;">No records found. Train to populate.</div>';
        if (data.hallOfFame && data.hallOfFame.length > 0) {
            hofHtml = data.hallOfFame.map(item => `
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding: 8px 0; font-size: 14px;">
                    <span style="color: var(--text);">${item.name}</span>
                    <span style="color: var(--primary); font-weight: bold;">${item.weight} kg</span>
                </div>
            `).join('');
        }

        // 3. Muscle Distribution
        let distHtml = '<div style="color: #8e8e93; font-size: 13px;">No data available.</div>';
        if (data.distribution && data.distribution.length > 0 && data.totalDistSets > 0) {
            distHtml = data.distribution.map(item => {
                const percent = ((item.count / data.totalDistSets) * 100).toFixed(1);
                return `
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: #8e8e93;">
                            <span>${item.category}</span>
                            <span>${percent}%</span>
                        </div>
                        <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;">
                            <div style="width: ${percent}%; height: 100%; background: var(--primary); border-radius: 4px;"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 4. Dropdown do Deep Dive
        let optionsHtml = '<option value="" disabled selected>Select exercise...</option>';
        if (data.exercises && data.exercises.length > 0) {
            optionsHtml += data.exercises.map(ex => `<option value="${ex.id}">${ex.name}</option>`).join('');
        }

        // USUNIĘTO KAFELEK "WORKOUTS"
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 20px; padding-bottom: 30px;">
                <h2 style="margin: 0;">Lifetime Milestones</h2>
                
                <div style="display: flex; gap: 10px;">
                    <div style="flex: 1; background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 15px; text-align: center;">
                        <div style="font-size: 10px; color: #8e8e93; text-transform: uppercase; letter-spacing: 1px;">Volume</div>
                        <div style="font-size: 22px; font-weight: bold; color: var(--text); margin-top: 5px;">${volumeStr} kg</div>
                    </div>
                    <div style="flex: 1; background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 15px; text-align: center;">
                        <div style="font-size: 10px; color: #8e8e93; text-transform: uppercase; letter-spacing: 1px;">Sets</div>
                        <div style="font-size: 22px; font-weight: bold; color: var(--text); margin-top: 5px;">${data.milestones.sets}</div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 20px;">
                        <h3 style="margin: 0 0 15px 0; font-size: 16px;">Hall of Fame</h3>
                        ${hofHtml}
                    </div>

                    <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 20px;">
                        <h3 style="margin: 0 0 15px 0; font-size: 16px;">Muscle Distribution</h3>
                        ${distHtml}
                    </div>
                </div>

                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 20px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 16px;">Exercise Deep Dive</h3>
                    <select id="deep-dive-select" style="width: 100%; padding: 12px; border-radius: 8px; background: var(--bg); color: var(--text); border: 1px solid var(--border); outline: none; margin-bottom: 20px;">
                        ${optionsHtml}
                    </select>
                    <div id="deep-dive-chart-container" style="min-height: 150px; display: flex; align-items: center; justify-content: center; color: #8e8e93; font-size: 13px;">
                        Select an exercise to view history
                    </div>
                </div>
            </div>
        `;

        document.getElementById('deep-dive-select').addEventListener('change', async (e) => {
            const exId = e.target.value;
            if (!exId) return;
            
            const chartContainer = document.getElementById('deep-dive-chart-container');
            chartContainer.innerHTML = 'Loading data...';

            try {
                const chartRes = await authFetch(`${API_URL}/stats/exercise/${state.currentUserId}/${exId}`);
                const chartData = await chartRes.json();
                
                if (!chartData || chartData.length === 0) {
                    chartContainer.innerHTML = 'No data available for this exercise.';
                    return;
                }

                if (chartData.length === 1) {
                    chartContainer.innerHTML = `<div style="text-align:center;">First log: <strong style="color:var(--primary);">${chartData[0].weight} kg</strong><br>Keep training to generate a chart.</div>`;
                    return;
                }

                const weights = chartData.map(d => d.weight);
                const min = Math.min(...weights);
                const max = Math.max(...weights);
                const range = max - min === 0 ? 1 : max - min;
                const padding = range * 0.2;
                const paddedMin = min - padding;
                const paddedRange = (max + padding) - paddedMin;

                const width = 300; 
                const height = 120;

                const points = weights.map((w, i) => {
                    const x = (i / (weights.length - 1)) * width;
                    const y = height - ((w - paddedMin) / paddedRange) * height;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                });

                chartContainer.innerHTML = `
                    <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 150px; overflow: visible;">
                        <polyline points="${points.join(' ')}" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                        ${points.map(p => `<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="4" fill="var(--bg)" stroke="var(--primary)" stroke-width="2" />`).join('')}
                    </svg>
                    <div style="display:flex; justify-content:space-between; margin-top: 10px; font-size: 11px; color: #8e8e93;">
                        <span>Start: ${chartData[0].weight} kg</span>
                        <span>Current: ${chartData[chartData.length-1].weight} kg</span>
                    </div>
                `;

            } catch (err) {
                chartContainer.innerHTML = 'Failed to load chart data.';
            }
        });

    } catch (e) {
        console.error("Stats error:", e);
        container.innerHTML = `<p style="color:var(--danger); text-align:center;">Failed to load statistics.</p>`;
    }
}