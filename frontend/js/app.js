import { state, logout } from './state.js';
import { renderAuthScreen } from './auth.js';
import { renderDashboard } from './dashboard.js';
import { renderPlans } from './plans.js'; 
import { renderWorkout } from './workout.js';
import { renderStats } from './stats.js';
import { renderSettings } from './settings.js';

/**
 * PWA Installation Logic
 * Intercepts the browser's default install prompt to trigger it manually later.
 */
window.deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered from Settings
    window.deferredPrompt = e;
});

// Global UI Exposure
window.openAuth = (mode) => renderAuthScreen(mode);
window.renderWorkout = renderWorkout;
window.appLogout = logout;

/**
 * SPA Router
 * Manages view transitions and navigation state.
 * @param {string} tab - The destination view identifier.
 */
window.navigate = (tab) => {
    // UI Update: Manage active state on navigation buttons
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Loading State: Show spinner while the module renders content
    const container = document.getElementById("exercises");
    container.innerHTML = `<div class="spinner" style="margin-top: 50px;"></div>`;

    // Small delay to ensure the DOM clears and the spinner is visible
    setTimeout(() => {
        switch (tab) {
            case 'home':
                renderDashboard(); 
                break;
            case 'workout':
                renderPlans(); 
                break;
            case 'stats':
                renderStats();
                break;
            case 'settings':
                renderSettings();
                break;
            default:
                renderDashboard();
        }
    }, 50); // Reduced delay for snappier feel
};

/**
 * App Initialization
 * Checks authentication status and prepares the UI on load.
 */
window.onload = () => {
    const sidebar = document.getElementById('sidebar');
    const topBar = document.getElementById('top-bar');
    const mainBg = document.getElementById('main-bg');

    if (!state.currentUserId) {
        // User not logged in: Show landing screen
        sidebar.style.display = 'none';
        topBar.style.display = 'none';
        mainBg.classList.remove('dimmed');
        renderLandingPage();
    } else {
        // User authenticated: Prepare workspace
        sidebar.style.display = 'flex';
        topBar.style.display = 'flex';
        mainBg.classList.add('dimmed');
        
        const greeting = document.getElementById('user-greeting');
        if (greeting) {
            greeting.innerHTML = `Hi, ${state.currentUserName} <span class="level-up-badge">READY TO LIFT?</span>`;
        }
        
        // Default entry point after login
        window.navigate('home'); 
    }
};

/**
 * Renders the initial landing page for unauthenticated users.
 */
function renderLandingPage() {
    document.getElementById("exercises").innerHTML = `
        <div class="auth-wrapper">
            <div class="landing-hero">
                <h1 class="hero-title">GYM TRACKER</h1>
                <p class="hero-subtitle">2026 Edition</p>
            </div>
            <div class="landing-actions">
                <button onclick="window.openAuth('login')" class="save-btn primary-glow">LOGIN</button>
                <button onclick="window.openAuth('signup')" class="btn-outline">CREATE ACCOUNT</button>
            </div>
        </div>
    `;
}