import { state, API_URL, authFetch } from "./state.js";

export async function renderDashboard() {
  const container = document.getElementById("exercises");
  container.innerHTML = `<div class="spinner" style="margin-top: 50px;"></div>`;

  try {
    const statsRes = await authFetch(`${API_URL}/dashboard/${state.currentUserId}`);
    const stats = await statsRes.json();

    const latestWeight =
      stats.weights && stats.weights.length > 0 ? stats.weights[0] : "--";

    // --- 1. TREND LINE (Weight) ---
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

    // --- 2. HEATMAP (Activity squares) ---
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

    // --- 3. VOLUME (Bar charts) ---
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
        if (val <= 15) return "#ff3b30"; // Critical
        if (val <= 50) return "#ff9500"; // Moderate
        if (val <= 85) return "#ffcc00"; // Light
        return "#32d74b"; // Ready
      };

      // Helper function to create interactive polygons
      const createPoly = (points, name) => {
        return `<polygon 
                  points="${points}" 
                  fill="${getColor(name)}" 
                  class="muscle-part" 
                  data-name="${name}" 
                  stroke="var(--bg)" 
                  stroke-width="1.5" 
                />`;
      };

      return `
        <style>
          .muscle-part { 
            transition: filter 0.3s ease, opacity 0.3s ease, stroke 0.3s ease; 
            cursor: pointer; 
          }
          /* Dodałem glow (drop-shadow) i rozjaśnienie przy najechaniu/kliknięciu */
          .muscle-part:hover, .muscle-part.active { 
            filter: drop-shadow(0 0 8px #ffffff88) brightness(1.2); 
            opacity: 1;
            stroke: #fff;
          }
          .legend-dot { 
            width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; 
          }
        </style>

        <div id="muscle-label" style="text-align:center; height:16px; font-weight:900; color:var(--primary); letter-spacing:3px; margin-bottom:15px; text-transform:uppercase; font-size:12px; transition: color 0.3s ease;">
          SELECT A MUSCLE
        </div>

        <div style="display:flex; justify-content:space-around; font-size:10px; font-weight:900; color:#a1a1aa; letter-spacing:5px; margin-bottom:10px; text-transform:uppercase;">
          <span>FRONT</span>
          <span>BACK</span>
        </div>

        <div style="display:flex; justify-content:center; align-items:center;">
          <svg viewBox="0 0 240 250" style="width:100%; max-width:500px; height:auto; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));">
            
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

        <div style="margin-top:20px; display:flex; justify-content:center; gap:15px; flex-wrap:wrap; border-top:1px solid rgba(255,255,255,0.05); padding-top:15px;">
          <div style="font-size:10px; color:#8e8e93; font-weight: 600;"><span class="legend-dot" style="background:#ff3b30;"></span>&lt;24h (REST)</div>
          <div style="font-size:10px; color:#8e8e93; font-weight: 600;"><span class="legend-dot" style="background:#ff9500;"></span>~48h (RECOV)</div>
          <div style="font-size:10px; color:#8e8e93; font-weight: 600;"><span class="legend-dot" style="background:#ffcc00;"></span>~72h (READY)</div>
          <div style="font-size:10px; color:#8e8e93; font-weight: 600;"><span class="legend-dot" style="background:#32d74b;"></span>&gt;72h (FRESH)</div>
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

        <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:16px; padding:15px;">
          <h4 style="margin:0 0 15px 0; color:#8e8e93; font-size:12px;">
            Muscle Readiness
          </h4>

          ${buildVisualReadiness(stats.readiness)}
        </div>

        <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:16px; padding:15px;">
          <h4 style="margin:0 0 10px 0; color:#8e8e93; font-size:12px;">
            Activity (Last 45 Days)
          </h4>

          <div style="display:flex; flex-wrap:wrap; gap:4px; justify-content:center;">
            ${buildHeatmap(stats.heatmap)}
          </div>
        </div>

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

    // --- INTERACTIVITY SCRIPT (Zmieniona logika podświetlania i blokowania nazw) ---
    const muscleLabel = document.getElementById("muscle-label");
    const muscleParts = document.querySelectorAll(".muscle-part");

    muscleParts.forEach(part => {
      // Najechanie myszką (tylko na komputerze)
      part.addEventListener("mouseenter", (e) => {
        // Jeśli żaden element nie jest zablokowany ("locked"), pokaż nazwę najechanego
        if (![...muscleParts].some(p => p.classList.contains('locked'))) {
          muscleLabel.innerText = e.target.getAttribute("data-name");
          muscleLabel.style.color = "var(--primary)";
        }
      });
      
      // Zjechanie myszką
      part.addEventListener("mouseleave", () => {
        // Jeśli żaden element nie jest zablokowany, zresetuj napis
        if (![...muscleParts].some(p => p.classList.contains('locked'))) {
          muscleLabel.innerText = "SELECT A MUSCLE";
          muscleLabel.style.color = "var(--text)";
        }
      });

      // Kliknięcie / Tapnięcie (Zamraża nazwę na wybranym mięśniu)
      part.addEventListener("click", (e) => {
        // Usuwamy "locked" i "active" z innych mięśni, chyba że klikamy w ten sam
        const isAlreadyLocked = part.classList.contains('locked');
        
        muscleParts.forEach(p => p.classList.remove('active', 'locked'));

        if (isAlreadyLocked) {
          // Jeśli kliknąłeś w już zaznaczony mięsień - odznacz go
          muscleLabel.innerText = "SELECT A MUSCLE";
          muscleLabel.style.color = "var(--text)";
        } else {
          // Jeśli kliknąłeś w nowy mięsień - zaznacz go
          part.classList.add('active', 'locked');
          muscleLabel.innerText = e.target.getAttribute("data-name");
          muscleLabel.style.color = "var(--primary)";
        }
      });
    });

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