/* =========================================
   1. CORE VARIABLES & THEME (NEON DARK)
   ========================================= */
:root {
    --bg-color: #0b101e;
    --primary: #00d2ff;
    --primary-glow: rgba(0, 210, 255, 0.4);
    --success: #ff9500; /* Used for Gains/Levels/Success states */
    --danger: #ff3b30;
    --text: #e6edf3;
    --card-bg: rgba(20, 25, 40, 0.65);
    --border: rgba(0, 210, 255, 0.15);
    --glass-blur: blur(12px);
    --app-height: 100vh; /* Controlled by JS for mobile browser bars */
}

* {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
}

html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden; 
    overscroll-behavior: none; 
    position: fixed; 
    top: 0; left: 0; right: 0; bottom: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg-color);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
}

/* Background Layer with Progressive Blur */
#main-bg {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: url('../gym-tracker.webp') center top / cover no-repeat;
    z-index: -1;
    transition: filter 0.5s ease;
}

#main-bg.dimmed {
    filter: brightness(0.2) blur(8px);
}

/* =========================================
   2. LAYOUT ARCHITECTURE
   ========================================= */
#app-container {
    display: flex;
    height: var(--app-height); 
    width: 100vw;
    overflow: hidden;
    transform: translateZ(0); 
}

#main-content {
    flex: 1; 
    display: flex; 
    flex-direction: column; 
    height: 100%;
    overflow: hidden; 
}

#top-bar {
    flex-shrink: 0; 
    display: flex; 
    justify-content: space-between; 
    align-items: center;
    padding: calc(15px + env(safe-area-inset-top)) 25px 15px 25px; 
    background: rgba(10, 15, 25, 0.85);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border-bottom: 1px solid var(--border);
    z-index: 1000;
}

#sidebar {
    width: 100%;
    background: rgba(10, 15, 25, 0.85);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border-bottom: 1px solid var(--border);
    display: flex; 
    justify-content: center;
    z-index: 999;
    padding-bottom: env(safe-area-inset-bottom);
}

.nav-links { 
    list-style: none; 
    padding: 0 10px; 
    margin: 0; 
    display: flex; 
    gap: 5px; 
    overflow-x: auto; 
    scrollbar-width: none;
}
.nav-links::-webkit-scrollbar { display: none; }

.nav-item {
    padding: 10px 16px;
    border: none; 
    background: transparent;
    font-size: 14px; 
    font-weight: 600; 
    color: #a1a1aa;
    cursor: pointer; 
    transition: all 0.2s ease; 
    white-space: nowrap;
    border-bottom: 3px solid transparent;
}

.nav-item.active {
    color: var(--primary);
    border-bottom: 3px solid var(--primary); 
    background: rgba(0, 210, 255, 0.05);
}

#exercises { 
    flex: 1; 
    overflow-y: auto; 
    padding: 25px; 
    max-width: 650px; 
    margin: 0 auto; 
    width: 100%;
    -webkit-overflow-scrolling: touch; 
}

/* =========================================
   3. REUSABLE COMPONENTS
   ========================================= */
.exercise-card, .stats-card {
    background: var(--card-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--border);
    border-radius: 22px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

input, select {
    width: 100%; 
    padding: 14px; 
    border: 1px solid var(--border); 
    border-radius: 12px; 
    font-size: 16px !important; 
    font-weight: 600;
    background: rgba(0, 0, 0, 0.3); 
    color: var(--text);
    outline: none; 
    transition: all 0.2s ease;
}
input:focus { border-color: var(--primary); box-shadow: 0 0 10px var(--primary-glow); }

.save-btn {
    width: 100%; 
    padding: 16px; 
    border-radius: 14px; 
    border: none;
    background: var(--primary); 
    color: #000; 
    font-weight: 800; 
    font-size: 15px; 
    text-transform: uppercase; 
    letter-spacing: 1px;
    box-shadow: 0 0 15px var(--primary-glow);
    cursor: pointer;
}

/* UI Elements for Wizard & Interactive Components */
.tile-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
}

.wizard-tile {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 15px;
    text-align: center;
    font-weight: 700;
    transition: all 0.2s ease;
    cursor: pointer;
}

.wizard-tile:active, .wizard-tile.active {
    background: rgba(0, 210, 255, 0.15);
    border-color: var(--primary);
    box-shadow: 0 0 12px var(--primary-glow);
}

/* =========================================
   4. MODALS & OVERLAYS
   ========================================= */
.modal-overlay {
    position: fixed; 
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.8); 
    z-index: 3000; 
    display: flex; 
    align-items: center; 
    justify-content: center;
    backdrop-filter: blur(8px);
}

.modal-content {
    background: var(--card-bg);
    border: 1px solid var(--border);
    width: 92%; 
    max-width: 500px;
    border-radius: 24px;
    overflow: hidden;
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* =========================================
   5. DASHBOARD SPECIFIC STYLES (NEW)
   ========================================= */
.muscle-part { 
    transition: filter 0.3s ease, stroke 0.3s ease; 
    cursor: pointer; 
}
.muscle-part:hover, .muscle-part.active { 
    filter: drop-shadow(0 0 6px #fff) brightness(1.2); 
    stroke: #fff;
}
.heatmap-sq {
    width: 12px; height: 12px; border-radius: 2px;
    background: rgba(255,255,255,0.05);
}
.heatmap-sq.active { background: var(--primary); box-shadow: 0 0 5px var(--primary-glow); }

/* Animations */
@keyframes popIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes spin { to { transform: rotate(360deg); } }

/* Desktop-specific hover effects */
@media (hover: hover) {
    .nav-item:hover { color: var(--text); }
    .save-btn:hover { filter: brightness(1.15); }
}