import { state, logout } from './state.js';
import { renderAuthScreen } from './auth.js';
import { renderDashboard } from './dashboard.js';
import { renderPlans } from './plans.js'; // NOWY IMPORT
import { renderWorkout } from './workout.js';
import { renderStats } from './stats.js';

window.openAuth = (mode) => renderAuthScreen(mode);
window.renderWorkout = renderWorkout;
window.appLogout = logout;

// ROUTER
window.navigate = (tab) => {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');

    const container = document.getElementById("exercises");
    container.innerHTML = `<div class="spinner" style="margin-top: 50px;"></div>`;

    setTimeout(() => {
        switch (tab) {
            case 'home':
                renderDashboard(); // HOME = STATYSTYKI
                break;
            case 'workout':
                renderPlans(); // WORKOUT = PLANY TRENINGOWE
                break;
            case 'stats':
                renderStats();
                break;
            case 'library':
                container.innerHTML = `
                    <div style="text-align:center; margin-top:60px; color:#8e8e93;">
                        <div style="font-size:60px; margin-bottom:20px; text-shadow: 0 0 15px var(--primary-glow);">📚</div>
                        <h2>Exercise Library</h2>
                        <p>Accessing mainframe... Coming soon.</p>
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
    const mainBg = document.getElementById('main-bg');

    if (!state.currentUserId) {
        sidebar.style.display = 'none';
        topBar.style.display = 'none';
        mainBg.classList.remove('dimmed');
        renderLandingPage();
    } else {
        sidebar.style.display = 'flex';
        topBar.style.display = 'flex';
        mainBg.classList.add('dimmed');
        
        document.getElementById('user-greeting').innerHTML = `Hi, ${state.currentUserName} <span class="level-up-badge">LEVEL UP!</span>`;
        window.navigate('home'); 
    }
};

function renderLandingPage() {
    document.getElementById("exercises").innerHTML = `
        <div class="auth-wrapper">
            <div style="display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 320px; padding: 20px;">
                <button onclick="window.openAuth('login')" class="save-btn" style="padding: 18px; font-size: 18px; box-shadow: 0 0 20px rgba(0, 210, 255, 0.4);">LOGIN</button>
                <button onclick="window.openAuth('signup')" class="save-btn" style="background: rgba(0,0,0,0.6); color: var(--primary); border: 2px solid var(--primary); box-shadow: none; padding: 18px; font-size: 18px;">CREATE ACCOUNT</button>
            </div>
        </div>
    `;
}