import { state, logout } from './state.js';
import { renderAuthScreen } from './auth.js';
import { renderDashboard } from './dashboard.js';
import { renderWorkout } from './workout.js';
// DODANY IMPORT STATYSTYK
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
                renderHomePage();
                break;
            case 'workout':
                renderDashboard(); 
                break;
            case 'stats':
                // WYWOŁANIE NOWEJ FUNKCJI
                renderStats();
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
                renderHomePage();
        }
    }, 100);
};

window.onload = () => {
    const sidebar = document.getElementById('sidebar');
    const topBar = document.getElementById('top-bar');

    if (!state.currentUserId) {
        sidebar.style.display = 'none';
        topBar.style.display = 'none';
        renderLandingPage();
    } else {
        sidebar.style.display = 'flex';
        topBar.style.display = 'flex';
        document.getElementById('user-greeting').innerText = `Hi, ${state.currentUserName} 👋`;
        window.navigate('home'); 
    }
};

function renderHomePage() {
    const container = document.getElementById("exercises");
    container.innerHTML = `
        <div style="text-align: center; margin-top: 40px;">
            <h1 style="font-size: 32px; margin-bottom: 10px;">Welcome to Gym Tracker</h1>
            <p style="color: #8e8e93; font-size: 18px; margin-bottom: 40px;">Ready for today's session?</p>
            
            <div id="home-graphic-container" style="
                width: 100%; 
                max-width: 500px; 
                height: 300px; 
                margin: 0 auto; 
                background: #e5e5ea; 
                border-radius: 20px; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                border: 2px dashed #c7c7cc;
                color: #8e8e93;
            ">
                <div style="text-align: center;">
                    <span style="font-size: 50px;">🖼️</span>
                    <p>Graphic / Illustration will be here</p>
                </div>
            </div>

            <div style="margin-top: 40px; display: flex; justify-content: center; gap: 15px;">
                <button onclick="window.navigate('workout')" class="save-btn" style="width: auto; padding: 15px 30px;">Go to Workouts</button>
            </div>
        </div>
    `;
}

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