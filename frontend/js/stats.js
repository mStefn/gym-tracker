import { state, API_URL, authFetch } from './state.js';

let chartInstance = null;
let rawStats = [];

export async function renderStats() {
    const container = document.getElementById("exercises");
    
    try {
        const res = await authFetch(`${API_URL}/stats/${state.currentUserId}`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        rawStats = await res.json();

        if (rawStats.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; margin-top:60px; color:#8e8e93;">
                    <div style="font-size:60px; margin-bottom:20px;">📉</div>
                    <h2>No data yet</h2>
                    <p>Complete some workouts to see your progress!</p>
                </div>`;
            return;
        }

        // Pobieramy unikalne nazwy ćwiczeń, które użytkownik kiedykolwiek robił
        const exercises = [...new Set(rawStats.map(log => log.exercise))].sort();
        
        let optionsHtml = exercises.map(ex => `<option value="${ex}">${ex}</option>`).join('');

        container.innerHTML = `
            <div style="padding: 10px;">
                <h2 style="margin-top:0; margin-bottom: 20px;">Your Progress</h2>
                
                <div class="exercise-card">
                    <label style="font-size: 12px; color: #8e8e93; font-weight: 600; margin-bottom: 5px; display: block;">SELECT EXERCISE</label>
                    <select id="stats-ex-select" style="font-weight: 600;">
                        ${optionsHtml}
                    </select>
                </div>

                <div class="exercise-card">
                    <div id="pr-display" style="text-align: center; margin-bottom: 15px;">
                        <span style="font-size: 12px; color: #8e8e93; font-weight: 600;">MAX WEIGHT (PR)</span><br>
                        <span id="pr-val" style="font-size: 24px; font-weight: 800; color: var(--primary);">-- kg</span>
                    </div>
                    
                    <div style="position: relative; height: 300px; width: 100%;">
                        <canvas id="progressChart"></canvas>
                    </div>
                </div>
            </div>
        `;

        const selectEl = document.getElementById("stats-ex-select");
        selectEl.addEventListener("change", (e) => drawChart(e.target.value));
        
        // Rysujemy wykres dla pierwszego ćwiczenia z listy
        if (exercises.length > 0) {
            drawChart(exercises[0]);
        }

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p style="color:var(--danger); text-align:center;">Failed to load statistics.</p>`;
    }
}

function drawChart(exerciseName) {
    // Filtrujemy dane tylko dla wybranego ćwiczenia
    const exData = rawStats.filter(log => log.exercise === exerciseName);
    
    // Grupujemy najlepszy wynik (max weight) dla każdego dnia
    const dailyMaxes = {};
    exData.forEach(log => {
        // Obcinamy godzinę, zostawiamy samą datę np. "2024-05-20"
        const dateStr = log.date.split('T')[0]; 
        if (!dailyMaxes[dateStr] || log.weight > dailyMaxes[dateStr]) {
            dailyMaxes[dateStr] = log.weight;
        }
    });

    // Sortujemy daty chronologicznie
    const sortedDates = Object.keys(dailyMaxes).sort();
    const weights = sortedDates.map(date => dailyMaxes[date]);

    // Obliczamy rekord
    const maxPR = Math.max(...weights);
    document.getElementById("pr-val").innerText = maxPR > 0 ? `${maxPR} kg` : '-- kg';

    const ctx = document.getElementById('progressChart').getContext('2d');
    
    // Niszczymy stary wykres, żeby nie nachodziły na siebie (tzw. "hover glitch")
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Ładne formatowanie dat na oś X (np. "15 May")
    const formattedLabels = sortedDates.map(d => {
        const date = new Date(d);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    });

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [{
                label: 'Max Weight (kg)',
                data: weights,
                borderColor: '#007AFF', // var(--primary)
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#007AFF',
                pointRadius: 5,
                fill: true,
                tension: 0.3 // Delikatne zaokrąglenie linii
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: '#e5e5ea' }
                },
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + ' kg';
                        }
                    }
                }
            }
        }
    });
}