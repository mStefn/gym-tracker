import { state, API_URL, authFetch } from "./state.js";

export async function renderDashboard() {
  const container = document.getElementById("exercises");
  container.innerHTML = `<div class="spinner" style="margin-top: 50px;"></div>`;

  try {
    const statsRes = await authFetch(`${API_URL}/dashboard/${state.currentUserId}`);
    const stats = await statsRes.json();

    const latestWeight =
      stats.weights && stats.weights.length > 0 ? stats.weights[0] : "--";

    // --- 1. TREND LINE (Waga) ---
    const buildSparkline = (weights) => {
      if (!weights || weights.length < 2) {
        return `
          <div style="height:40px; display:flex; align-items:center; justify-content:center; color:#8e8e93; font-size:11px;">
            Log at least 2 weights to see trend
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

      const lastY =
        height -
        ((data[data.length - 1] - paddedMin) / paddedRange) * height;

      return `
        <svg viewBox="0 0 100 40" preserveAspectRatio="none"
             style="width:100%; height:40px; margin-top:15px; overflow:visible;">
          
          <defs>
            <linearGradient id="sparkline-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/>
            </linearGradient>
          </defs>

          <polygon
            points="${fillPoints}"
            fill="url(#sparkline-gradient)"
          />

          <polyline
            points="${points.join(" ")}"
            fill="none"
            stroke="var(--primary)"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <circle
            cx="${width}"
            cy="${lastY.toFixed(1)}"
            r="2.5"
            fill="var(--bg)"
            stroke="var(--primary)"
            stroke-width="1.5"
          />
        </svg>
      `;
    };

    // --- 2. HEATMAP (Aktywność - kwadraciki) ---
    const buildHeatmap = (activeDates) => {
      const safeDates = activeDates || [];
      let squares = "";

      for (let i = 44; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);

        const dateStr = d.toISOString().split("T")[0];
        const isActive = safeDates.includes(dateStr);

        squares += `
          <div
            style="
              width:12px;
              height:12px;
              border-radius:2px;
              background:${isActive ? "var(--primary)" : "rgba(255,255,255,0.05)"};
            "
          ></div>
        `;
      }

      return squares;
    };

    // --- 3. VOLUME (Objętość - słupki) ---
    const buildVolume = (volArray) => {
      const getYearWeek = (d) => {
        const date = new Date(
          Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
        );

        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);

        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));

        const weekNo = Math.ceil(
          ((date - yearStart) / 86400000 + 1) / 7
        );

        return `${date.getUTCFullYear()}${weekNo
          .toString()
          .padStart(2, "0")}`;
      };

      const last4Weeks = [];

      for (let i = 3; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i * 7);
        last4Weeks.push(getYearWeek(d));
      }

      const safeVolArray = volArray || [];

      const finalData = last4Weeks.map((weekStr) => {
        const found = safeVolArray.find((v) => v.week === weekStr);

        return {
          week: weekStr,
          total: found ? found.total : 0,
        };
      });

      const maxVol = Math.max(...finalData.map((v) => v.total));

      return finalData
        .map((v) => {
          const height = maxVol > 0 ? (v.total / maxVol) * 100 : 0;

          const displayVol =
            v.total > 0 ? (v.total / 1000).toFixed(1) + "k" : "0.0k";

          const finalHeight = Math.max(height, 2);

          const opacity =
            height === 100 && maxVol > 0 ? "1" : "0.4";

          return `
            <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
              
              <div style="height:60px; width:100%; display:flex; align-items:flex-end; justify-content:center; margin-bottom:5px;">
                
                <div
                  style="
                    width:20px;
                    height:${finalHeight}%;
                    background:var(--primary);
                    border-radius:4px;
                    opacity:${opacity};
                    transition:height 0.5s ease;
                  "
                ></div>

              </div>

              <span
                style="
                  font-size:10px;
                  color:${v.total > 0 ? "var(--text)" : "#8e8e93"};
                  font-weight:600;
                "
              >
                ${displayVol}
              </span>

            </div>
          `;
        })
        .join("");
    };

    // --- 4. MUSCLE READINESS ---
    const buildVisualReadiness = (readinessObj) => {
      const safeR = readinessObj || {};

      const getColor = (cat) => {
        const val = safeR[cat] !== undefined ? safeR[cat] : 100;

        if (val <= 15) return "#ff3b30";
        if (val <= 50) return "#ff9500";
        if (val <= 85) return "#ffcc00";

        return "#32d74b";
      };

      return `
        <!-- FRONT / BACK LABEL -->
        <div style="display:flex; justify-content:space-around; font-size:11px; font-weight:900; color:#a1a1aa; letter-spacing:3px; margin-bottom:10px;">
          <span>FRONT</span>
          <span>BACK</span>
        </div>

        <div style="display:flex; justify-content:center; gap:20px; padding-bottom:10px;">

          <svg viewBox="0 0 240 250"
               style="width:100%; max-width:400px; height:auto; filter:drop-shadow(0 0 15px rgba(0,0,0,0.3));">

            <!-- FRONT -->
            <g transform="translate(10,0)">
              <circle cx="50" cy="20" r="14" fill="rgba(255,255,255,0.05)" />

              <circle cx="22" cy="55" r="12" fill="${getColor("Shoulders")}" />
              <circle cx="78" cy="55" r="12" fill="${getColor("Shoulders")}" />

              <rect x="12" y="72" width="20" height="50" rx="10" fill="${getColor("Biceps")}" />
              <rect x="68" y="72" width="20" height="50" rx="10" fill="${getColor("Biceps")}" />

              <rect x="30" y="45" width="40" height="28" rx="10" fill="${getColor("Chest")}" />

              <rect x="34" y="77" width="32" height="45" rx="10" fill="${getColor("Abs")}" />

              <rect x="32" y="128" width="16" height="65" rx="8" fill="${getColor("Quads")}" />
              <rect x="52" y="128" width="16" height="65" rx="8" fill="${getColor("Quads")}" />
            </g>

            <!-- BACK -->
            <g transform="translate(130,0)">
              <circle cx="50" cy="20" r="14" fill="rgba(255,255,255,0.05)" />

              <circle cx="22" cy="55" r="12" fill="${getColor("Shoulders")}" />
              <circle cx="78" cy="55" r="12" fill="${getColor("Shoulders")}" />

              <rect x="12" y="72" width="20" height="50" rx="10" fill="${getColor("Triceps")}" />
              <rect x="68" y="72" width="20" height="50" rx="10" fill="${getColor("Triceps")}" />

              <rect x="30" y="45" width="40" height="77" rx="10" fill="${getColor("Back")}" />

              <circle cx="36" cy="130" r="12" fill="${getColor("Glutes")}" />
              <circle cx="64" cy="130" r="12" fill="${getColor("Glutes")}" />

              <rect x="28" y="145" width="16" height="50" rx="8" fill="${getColor("Hamstrings")}" />
              <rect x="56" y="145" width="16" height="50" rx="8" fill="${getColor("Hamstrings")}" />

              <rect x="28" y="200" width="16" height="45" rx="8" fill="${getColor("Calves")}" />
              <rect x="56" y="200" width="16" height="45" rx="8" fill="${getColor("Calves")}" />
            </g>

          </svg>

        </div>
      `;
    };

    const currentExp = stats.exp || 0;
    const currentLevel = stats.level || 1;
    const expTarget = 1000;

    const progressPercent = Math.min(
      (currentExp / expTarget) * 100,
      100
    );

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:15px; padding-bottom:20px;">
        
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <h2 style="margin:0;">Dashboard</h2>
          <div style="background:rgba(255,149,0,0.15); color:var(--success); padding:5px 12px; border-radius:20px; font-weight:800; font-size:13px;">
            LEVEL ${currentLevel}
          </div>
        </div>

        <!-- XP CARD -->
        <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:16px; padding:20px; text-align:center;">
          <h3 style="margin:0 0 5px 0; color:var(--primary); font-size:14px; text-transform:uppercase;">
            Experience Points
          </h3>

          <div style="font-size:28px; font-weight:900; margin-bottom:15px;">
            ${currentExp}
            <span style="font-size:14px; color:#8e8e93;">/ ${expTarget}</span>
          </div>

          <div style="width:100%; height:10px; background:rgba(0,0,0,0.6); border-radius:10px; overflow:hidden;">
            <div
              style="
                width:${progressPercent}%;
                height:100%;
                background:linear-gradient(90deg,var(--primary),var(--success));
                transition:width 1s ease;
              "
            ></div>
          </div>
        </div>

        <!-- WEIGHT -->
        <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:16px; padding:15px;">
          <h4 style="margin:0 0 10px 0; color:#8e8e93; font-size:12px;">
            Body Weight
          </h4>

          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div style="font-size:24px; font-weight:bold;">
              ${latestWeight}
              <span style="font-size:14px; color:#8e8e93;">kg</span>
            </div>

            <div style="display:flex; gap:8px;">
              <input
                type="number"
                id="weight-input"
                placeholder="0.0"
                style="width:60px; padding:5px; text-align:center;"
              />

              <button onclick="window.logWeight()">
                Log
              </button>
            </div>
          </div>

          ${buildSparkline(stats.weights)}
        </div>

        <!-- MUSCLE READINESS -->
        <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:16px; padding:15px;">
          <h4 style="margin:0 0 15px 0; color:#8e8e93; font-size:12px;">
            Muscle Readiness
          </h4>

          ${buildVisualReadiness(stats.readiness)}
        </div>

        <!-- HEATMAP -->
        <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:16px; padding:15px;">
          <h4 style="margin:0 0 10px 0; color:#8e8e93; font-size:12px;">
            Activity (Last 45 Days)
          </h4>

          <div style="display:flex; flex-wrap:wrap; gap:4px; justify-content:center;">
            ${buildHeatmap(stats.heatmap)}
          </div>
        </div>

        <!-- VOLUME -->
        <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:16px; padding:15px;">
          <h4 style="margin:0 0 10px 0; color:#8e8e93; font-size:12px;">
            Volume (Last 4 Weeks)
          </h4>

          <div style="display:flex; justify-content:space-between; align-items:flex-end;">
            ${buildVolume(stats.volume)}
          </div>
        </div>

      </div>
    `;
  } catch (e) {
    console.error("Dashboard error:", e);

    container.innerHTML = `
      <p style="color:var(--danger); text-align:center;">
        Failed to load dashboard.
      </p>
    `;
  }
}

window.logWeight = async () => {
  const w = parseFloat(document.getElementById("weight-input").value);

  if (!w || w <= 0) {
    return alert("Enter valid weight");
  }

  try {
    await authFetch(`${API_URL}/weight`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: parseInt(state.currentUserId),
        weight: w,
      }),
    });

    window.navigate("home");
  } catch (e) {
    alert("Failed to log weight");
  }
};