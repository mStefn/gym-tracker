import { state, API_URL, authFetch } from "./state.js";

/**
 * Main function to render the user dashboard with metrics and visualizations
 */
export async function renderDashboard() {
  const container = document.getElementById("exercises");
  container.innerHTML = `<div class="spinner" style="margin-top: 50px;"></div>`;

  try {
    const statsRes = await authFetch(`${API_URL}/dashboard/${state.currentUserId}`);
    const stats = await statsRes.json();

    const latestWeight = stats.weights && stats.weights.length > 0 ? stats.weights[0] : "--";

    /**
     * 1. SPARKLINE GENERATOR (Body Weight Trend)
     * Creates a lightweight SVG trend line for weight logs
     */
    const buildSparkline = (weights) => {
      if (!weights || weights.length < 2) {
        return `
          <div class="sparkline-placeholder">
            Log at least 2 entries to see your weight trend
          </div>
        `;
      }

      const data = [...weights].reverse();
      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min === 0 ? 1 : max - min;

      const padding = range * 0.2;
      const paddedMin = min - padding;
      const paddedRange = max + padding - paddedMin;

      const width = 100;
      const height = 40;

      const points = data.map((w, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((w - paddedMin) / paddedRange) * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });

      const fillPoints = `0,${height} ${points.join(" ")} ${width},${height}`;
      const lastY = height - ((data.at(-1) - paddedMin) / paddedRange) * height;

      return `
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" class="sparkline-svg">
          <defs>
            <linearGradient id="sparkline-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <polygon points="${fillPoints}" fill="url(#sparkline-gradient)" />
          <polyline points="${points.join(" ")}" fill="none" stroke="var(--primary)" 
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="${width}" cy="${lastY.toFixed(1)}" r="2.5" fill="var(--bg)" 
                  stroke="var(--primary)" stroke-width="1.5" />
        </svg>
      `;
    };

    /**
     * 2. HEATMAP GENERATOR (Activity Squares)
     * Renders a GitHub-style activity grid for the last 45 days
     */
    const buildHeatmap = (activeDates) => {
      const safeDates = activeDates || [];
      let squares = "";

      for (let i = 44; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const isActive = safeDates.includes(dateStr);

        squares += `<div class="heatmap-sq ${isActive ? 'active' : ''}"></div>`;
      }
      return squares;
    };

    /**
     * 3. VOLUME CALCULATOR (Weekly Bar Charts)
     */
    const buildVolume = (volArray) => {
      const getYearWeek = (d) => {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
        return `${date.getUTCFullYear()}${weekNo.toString().padStart(2, "0")}`;
      };

      const last4Weeks = [];
      for (let i = 3; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - (i * 7));
        last4Weeks.push(getYearWeek(d));
      }

      const safeVolArray = volArray || [];
      const finalData = last4Weeks.map((weekStr) => {
        const found = safeVolArray.find((v) => v.week === weekStr);
        return { week: weekStr, total: found ? found.total : 0 };
      });

      const maxVol = Math.max(...finalData.map((v) => v.total));

      return finalData.map((v) => {
          const height = maxVol > 0 ? (v.total / maxVol) * 100 : 0;
          const displayVol = v.total > 0 ? (v.total / 1000).toFixed(1) + "k" : "0.0k";
          return `
            <div class="volume-bar-wrapper">
              <div class="volume-bar-container">
                <div class="volume-bar" style="height:${Math.max(height, 2)}%; opacity:${height === 100 ? '1' : '0.4'};"></div>
              </div>
              <span class="volume-label">${displayVol}</span>
            </div>
          `;
        }).join("");
    };

    /**
     * 4. MUSCLE READINESS MAP (Interactive SVG)
     */
    const buildVisualReadiness = (readinessObj) => {
      const safeR = readinessObj || {};
      const getColor = (cat) => {
        const val = safeR[cat] !== undefined ? safeR[cat] : 100;
        if (val <= 15) return "#ff3b30"; // Needs rest
        if (val <= 50) return "#ff9500"; // Recovering
        if (val <= 85) return "#ffcc00"; // Almost ready
        return "#32d74b"; // Fresh
      };

      const createPoly = (points, name) => {
        return `<polygon points="${points}" fill="${getColor(name)}" class="muscle-part" data-name="${name}" stroke="var(--bg)" stroke-width="1.5" />`;
      };

      return `
        <div id="muscle-label" class="readiness-label">SELECT A MUSCLE</div>
        <div class="body-view-container">
          <svg viewBox="0 0 240 250" class="body-svg">
            <g transform="translate(10, 0)">
              <polygon points="42,5 58,5 62,15 50,25 38,15" fill="rgba(255,255,255,0.05)" />
              ${createPoly("32,40 50,45 68,40 70,62 50,68 30,62", "Chest")}
              ${createPoly("10,40 22,40 25,52 16,62 7,52", "Shoulders")}
              ${createPoly("78,40 90,40 93,52 84,62 75,52", "Shoulders")}
              ${createPoly("35,70 65,70 62,110 50,120 38,110", "Abs")}
              ${createPoly("10,66 18,63 24,105 16,110", "Biceps")}
              ${createPoly("90,66 82,63 76,105 84,110", "Biceps")}
              ${createPoly("34,125 49,125 46,195 30,190", "Quads")}
              ${createPoly("66,125 51,125 54,195 70,190", "Quads")}
            </g>
            <g transform="translate(130, 0)">
              <polygon points="42,5 58,5 62,15 50,25 38,15" fill="rgba(255,255,255,0.05)" />
              ${createPoly("28,40 72,40 62,105 38,105", "Back")}
              ${createPoly("35,110 65,110 68,130 50,138 32,130", "Glutes")}
              ${createPoly("10,40 22,40 25,52 16,62 7,52", "Shoulders")}
              ${createPoly("78,40 90,40 93,52 84,62 75,52", "Shoulders")}
              ${createPoly("10,66 18,63 22,105 14,110", "Triceps")}
              ${createPoly("90,66 82,63 78,105 86,110", "Triceps")}
              ${createPoly("30,145 48,145 45,200 32,200", "Hamstrings")}
              ${createPoly("70,145 52,145 55,200 68,200", "Hamstrings")}
              ${createPoly("32,205 44,205 42,240 34,240", "Calves")}
              ${createPoly("68,205 56,205 58,240 66,240", "Calves")}
            </g>
          </svg>
        </div>
      `;
    };

    const currentExp = stats.exp || 0;
    const currentLevel = stats.level || 1;
    const expTarget = 1000;
    const progressPercent = Math.min((currentExp / expTarget) * 100, 100);

    // Final Dashboard Assembly
    container.innerHTML = `
      <div class="dashboard-wrapper">
        <div class="dashboard-header">
          <h2 class="view-title">Dashboard</h2>
          <div class="level-badge">LEVEL ${currentLevel}</div>
        </div>

        <div class="stats-card centered">
          <h3 class="card-label">Experience Points</h3>
          <div class="main-stat">${currentExp} <span class="sub-stat">/ ${expTarget}</span></div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width:${progressPercent}%;"></div>
          </div>
        </div>

        <div class="stats-card">
          <h4 class="card-label">Body Weight</h4>
          <div class="weight-flex">
            <div class="main-stat">${latestWeight} <span class="sub-stat">kg</span></div>
            <div class="weight-input-group">
              <input type="number" id="weight-input" placeholder="0.0" class="mini-input" />
              <button onclick="window.logWeight()" class="btn-mini">Log</button>
            </div>
          </div>
          ${buildSparkline(stats.weights)}
        </div>

        <div class="stats-card">
          <h4 class="card-label">Muscle Readiness</h4>
          ${buildVisualReadiness(stats.readiness)}
        </div>

        <div class="stats-card">
          <h4 class="card-label">Activity (Last 45 Days)</h4>
          <div class="heatmap-grid">${buildHeatmap(stats.heatmap)}</div>
        </div>

        <div class="stats-card">
          <h4 class="card-label">Training Volume (Last 4 Weeks)</h4>
          <div class="volume-chart">${buildVolume(stats.volume)}</div>
        </div>
      </div>
    `;

    // Interactivity logic for the Muscle Map
    setupMuscleInteractivity();

  } catch (e) {
    console.error("Dashboard Render Error:", e);
    container.innerHTML = `<p class="error-text">Failed to load dashboard data.</p>`;
  }
}

/**
 * Attaches event listeners to muscle groups for hover and click effects
 */
function setupMuscleInteractivity() {
  const muscleLabel = document.getElementById("muscle-label");
  const muscleParts = document.querySelectorAll(".muscle-part");

  muscleParts.forEach(part => {
    part.addEventListener("mouseenter", (e) => {
      if (![...muscleParts].some(p => p.classList.contains('locked'))) {
        muscleLabel.innerText = e.target.getAttribute("data-name");
        muscleLabel.classList.add("highlight");
      }
    });
    
    part.addEventListener("mouseleave", () => {
      if (![...muscleParts].some(p => p.classList.contains('locked'))) {
        muscleLabel.innerText = "SELECT A MUSCLE";
        muscleLabel.classList.remove("highlight");
      }
    });

    part.addEventListener("click", (e) => {
      const isAlreadyLocked = part.classList.contains('locked');
      muscleParts.forEach(p => p.classList.remove('active', 'locked'));

      if (!isAlreadyLocked) {
        muscleLabel.innerText = "SELECT A MUSCLE";
        muscleLabel.classList.remove("highlight");        
      } else {
        part.classList.add('active', 'locked');
        muscleLabel.innerText = e.target.getAttribute("data-name");
        muscleLabel.classList.add("highlight");
      }
    });
  });
}

/**
 * Handles weight logging submission
 */
window.logWeight = async () => {
  const weightInput = document.getElementById("weight-input");
  const weight = Number.parseFloat(weightInput.value);

  if (!weight || weight <= 0) return alert("Please enter a valid weight value.");

  try {
    // Note: userID is identified by the server via session token
    await authFetch(`${API_URL}/weight`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight }),
    });

    window.navigate("home");
  } catch (e) {
    console.error("Weight Log Error:", e);
    alert("Failed to sync weight data.");
  }
};