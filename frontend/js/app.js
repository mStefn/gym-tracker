import { state } from './state.js';
import { renderAuthScreen } from './auth.js';
import { renderDashboard } from './dashboard.js';
import './workout.js'; // Załaduj widok treningu

window.onload = () => {
    if (!state.currentUserId) {
        renderLandingPage();
    } else {
        renderDashboard();
    }
};

function renderLandingPage() {
    document.getElementById("main-nav").innerHTML = `
        <button onclick="window.openAuth('login')" class="btn-nav btn-login">Login</button>
        <button onclick="window.openAuth('signup')" class="btn-nav btn-signup">Sign Up</button>
    `;
    document.getElementById("exercises").innerHTML = `
        <div class="hero">
            <div style="font-size:80px; margin-bottom:20px;">💪</div>
            <h1>Gym Tracker</h1>
            <p>Your ultimate companion for strength and progress.</p>
        </div>
    `;
}

window.openAuth = (mode) => renderAuthScreen(mode);