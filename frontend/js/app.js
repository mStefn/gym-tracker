import { state, logout } from './state.js';
import { renderAuthScreen } from './auth.js';
import { renderDashboard } from './dashboard.js';
import { renderWorkout } from './workout.js';

window.openAuth = (mode) => renderAuthScreen(mode);
window.renderWorkout = renderWorkout;
window.appLogout = logout;

// PROSTY ROUTER SPA
window.navigate = (tab) => {
    // 1. Ustaw aktywne menu
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');

    // 2. Wyczyść kontener na ładowanie
    const container = document.getElementById("exercises");
    container.innerHTML = `<div class="spinner" style="margin-top: 50px;"></div>`;

    // 3. Renderuj widoki
    setTimeout(() => {
        switch (tab) {
            case 'workout':
                renderDashboard(); 
                break;
            case 'stats':
                container.innerHTML = `
                    <div style="text-align:center; margin-top:60px; color:#8e8e93;">
                        <div style="font-size:60px; margin-bottom:20px;">📈</div>
                        <h2>Statistics & Progress</h2>
                        <p>Coming soon...</p>
                    </div>`;
                break;
            case 'library':
                container.innerHTML = `
                    <div style="text-align:center; margin-top:60px; color:#8e8e93;">
                        <div style="font-size:60px; margin-bottom:20px;">📚</div>
                        <h2>Exercise Library</h2>
                        <p>Coming soon...</p>
                    </div>`;
                break;
            case 'settings':
                if (window.renderSettings) window.renderSettings();
                break;
            default:
                renderDashboard();
        }
    }, 100);
};

window.onload = () => {
    const sidebar = document.getElementById('sidebar');
    const topBar = document.getElementById('top-bar');

    if (!state.currentUserId) {
        // NIEZALOGOWANY
        sidebar.style.display = 'none';
        topBar.style.display = 'none';
        renderLandingPage();
    } else {
        // ZALOGOWANY
        sidebar.style.display = 'flex';
        topBar.style.display = 'flex';
        document.getElementById('user-greeting').innerText = `Hi, ${state.currentUserName} 👋`;
        window.navigate('workout');
    }
};

function renderLandingPage() {
    document.getElementById("exercises").innerHTML = `
        <div style="text-align: right; margin-bottom: 40px;">
            <button onclick="window.openAuth('login')" class="btn-nav btn-login">Login</button>
            <button onclick="window.openAuth('signup')" class="btn-nav btn-signup">Sign Up</button>
        </div>
        <div class="hero">
            <div style="font-size:80px; margin-bottom:20px;">💪</div>
            <h1>Gym Tracker</h1>
            <p>Your ultimate companion for strength and progress.</p>
        </div>
    `;
}