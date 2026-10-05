import { state, API_URL, authFetch } from './state.js';

/**
 * Renders the Advanced Statistics view, including milestones, records, and deep-dive charts.
 */
export async function renderStats() {
    const container = document.getElementById("exercises");
    container.innerHTML = `<div class="spinner" style="margin-top: 50px;"></div>`;

    try {
        // Fetch aggregated statistics from the Go backend
        const res = await authFetch(`${API_URL}/stats/advanced/${state.currentUserId}`);
        const data = await res.json();

        // 1. Calculate Milestones display (formatted in 'k' for thousands)
        const volumeStr = data.milestones.volume > 0 ? (data.milestones.volume / 1000).toFixed(1) + 'k' : '0';
        
        // 2. Build Hall of Fame (Personal Records)
        let hofHtml = '<div class="empty-stats-text">No records found yet. Keep training!</div>';
        if (data.hallOfFame && data.hallOfFame.length > 0) {
            hofHtml = data.hallOfFame.map(item => `
                <div class="hof-row">
                    <span class="hof-exercise-name">${item.name}</span>
                    <span class="hof-weight-value">${item.weight} kg</span>
                </div>
            `).join('');
        }

        // 3. Build Muscle Distribution (Progress bars per category)
        let distHtml = '<div class="empty-stats-text">No data available for distribution.</div>';
        if (data.distribution && data.distribution.length > 0 && data.totalDistSets > 0) {
            distHtml = data.distribution.map(item => {
                const percent = ((item.count / data.totalDistSets) * 100).toFixed(1);
                return `
                    <div class="dist-row">
                        <div class="dist-labels">
                            <span>${item.category}</span>
                            <span>${percent}%</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: ${percent}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 4. Build Exercise Deep Dive Dropdown
        let optionsHtml = '<option value="" disabled selected>Select exercise to analyze...</option>';
        if (data.exercises && data.exercises.length > 0) {
            optionsHtml += data.exercises.map(ex => `<option value="${ex.id}">${ex.name}</option>`).join('');
        }

        // --- Render Main Container Structure ---
        container.innerHTML = `
            <div class="stats-wrapper">
                <h2 class="view-title">Lifetime Milestones</h2>
                
                <div class="milestone-grid">
                    <div class="milestone-card">
                        <div class="milestone-label">Total Volume</div>
                        <div class="milestone-value">${volumeStr} kg</div>
                    </div>
                    <div class="milestone-card">
                        <div class="milestone-label">Total Sets</div>
                        <div class="milestone-value">${data.milestones.sets}</div>
                    </div>
                </div>

                <div class="stats-sections-stack">
                    <div class="stats-card">
                        <h3 class="card-subtitle">Hall of Fame (PRs)</h3>
                        <div class="hof-list">${hofHtml}</div>
                    </div>

                    <div class="stats-card">
                        <h3 class="card-subtitle">Training Distribution</h3>
                        ${distHtml}
                    </div>

                    <div class="stats-card">
                        <h3 class="card-subtitle">Exercise Deep Dive</h3>
                        <div class="select-wrapper">
                            <select id="deep-dive-select" class="main-select">
                                ${optionsHtml}
                            </select>
                        </div>
                        <div id="deep-dive-chart-container" class="chart-viewport">
                            <p class="placeholder-text">Select an exercise to view its progression history.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // --- Deep Dive Interactivity ---
        document.getElementById('deep-dive-select').addEventListener('change', async (e) => {
            const exId = e.target.value;
            if (!exId) return;
            
            const chartContainer = document.getElementById('deep-dive-chart-container');
            chartContainer.innerHTML = '<div class="spinner-small"></div>';

            try {
                const chartRes = await authFetch(`${API_URL}/stats/exercise/${state.currentUserId}/${exId}`);
                const chartData = await chartRes.json();
                
                if (!chartData || chartData.length === 0) {
                    chartContainer.innerHTML = '<p class="info-text">No tracking data found for this exercise.</p>';
                    return;
                }

                if (chartData.length === 1) {
                    chartContainer.innerHTML = `
                        <div class="single-point-data">
                            Initial Record: <strong class="primary-color">${chartData[0].weight} kg</strong><br>
                            <span class="sub-text">More logs required to generate a progress chart.</span>
                        </div>`;
                    return;
                }

                // --- SVG Chart Logic (Dynamic Scaling) ---
                const weights = chartData.map(d => d.weight);
                const min = Math.min(...weights);
                const max = Math.max(...weights);
                const range = max - min === 0 ? 1 : max - min;
                
                // Add 20% vertical padding for visual clarity
                const padding = range * 0.2;
                const paddedMin = min - padding;
                const paddedRange = (max + padding) - paddedMin;

                const width = 300; 
                const height = 120;

                // Calculate points: y = height - ((weight - min) / range) * height
                const points = weights.map((w, i) => {
                    const x = (i / (weights.length - 1)) * width;
                    const y = height - ((w - paddedMin) / paddedRange) * height;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                });

                chartContainer.innerHTML = `
                    <svg viewBox="0 0 ${width} ${height}" class="deep-dive-svg">
                        <polyline points="${points.join(' ')}" class="chart-line" />
                        ${points.map(p => {
                            const [cx, cy] = p.split(',');
                            return `<circle cx="${cx}" cy="${cy}" r="4" class="chart-point" />`;
                        }).join('')}
                    </svg>
                    <div class="chart-footer">
                        <span>Start: ${chartData[0].weight} kg</span>
                        <span>Current: ${chartData[chartData.length-1].weight} kg</span>
                    </div>
                `;

            } catch (err) {
                console.error("Deep Dive Error:", err);
                chartContainer.innerHTML = '<p class="error-text">Failed to load analytics data.</p>';
            }
        });

    } catch (e) {
        console.error("Stats Rendering Error:", e);
        container.innerHTML = `<p class="error-text">Critical failure: Statistics service unreachable.</p>`;
    }
}