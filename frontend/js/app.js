import { state, logout } from './state.js';
import { renderAuthScreen } from './auth.js';
import { renderDashboard } from './dashboard.js';
import { renderPlans } from './plans.js'; 
import { renderWorkout } from './workout.js';
import { renderStats } from './stats.js';
import { renderSettings } from './settings.js';

/**
 * PWA Installation Logic
 */
window.deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
});

// Global UI Exposure
window.openAuth = (mode) => renderAuthScreen(mode);
window.renderWorkout = renderWorkout;
window.appLogout = logout;

/**
 * SPA Router
 */
window.navigate = (tab) => {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');

    const container = document.getElementById("exercises");
    container.innerHTML = `<div class="spinner" style="margin-top: 50px;"></div>`;

    setTimeout(() => {
        switch (tab) {
            case 'home': renderDashboard(); break;
            case 'workout': renderPlans(); break;
            case 'stats': renderStats(); break;
            case 'settings': renderSettings(); break;
            default: renderDashboard();
        }
    }, 50); 
};

/**
 * App Initialization
 */
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
        
        const greeting = document.getElementById('user-greeting');
        if (greeting) {
            // Używamy klasy level-badge zdefiniowanej w CSS
            greeting.innerHTML = `Hi, ${state.currentUserName} <span class="level-badge">READY TO LIFT?</span>`;
        }
        
        window.navigate('home'); 
    }
};

/**
 * Landing Page
 */
function renderLandingPage() {
    document.getElementById("exercises").innerHTML = `
        <div class="auth-wrapper">
            <div class="landing-hero">
                <h1 class="hero-title">GYM TRACKER</h1>
                <p class="hero-subtitle">2026 Edition</p>
            </div>
            <div class="landing-actions">
                <button onclick="window.openAuth('login')" class="save-btn">LOGIN</button>
                <button onclick="window.openAuth('signup')" class="btn-outline">CREATE ACCOUNT</button>
            </div>
        </div>
    `;
}