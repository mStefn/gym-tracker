import { state, logout } from './state.js';
import { renderAuthScreen } from './auth.js';
import { renderDashboard } from './dashboard.js';
import { renderWorkout } from './workout.js';

// Rejestracja funkcji globalnych
window.openAuth = (mode) => renderAuthScreen(mode);
window.renderWorkout = renderWorkout;
window.appLogout = logout;

// PROSTY ROUTER SPA
window.navigate = (tab) => {
    // 1. Zmiana aktywnego przycisku w menu
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');

    // 2. Czyszczenie starych danych z kontenera
    document.getElementById("main-nav").innerHTML = "";
    const container = document.getElementById("exercises");
    container.innerHTML = `<div class="spinner" style="margin-top: 50px;"></div>`;

    // 3. Ładowanie odpowiedniego widoku
    setTimeout(() => {
        switch (tab) {
            case 'workout':
                renderDashboard(); // Aktualnie dashboard to nasze "Workouts"
                break;
            case 'stats':
                container.innerHTML = `<h2 style="text-align:center; margin-top:40px;">Wkrótce: Statystyki 📈</h2>`;
                // Tu w następnym kroku dodamy renderStats()
                break;
            case 'library':
                container.innerHTML = `<h2 style="text-align:center; margin-top:40px;">Wkrótce: Atlas Ćwiczeń 📚</h2>`;
                // Tu w następnym kroku dodamy renderLibrary()
                break;
            case 'settings':
                if (window.renderSettings) window.renderSettings();
                break;
            default:
                renderDashboard();
        }
    }, 100); // Minimalne opóźnienie, aby pokazać spinner (UX)
};

window.onload = () => {
    const sidebar = document.getElementById('sidebar');

    if (!state.currentUserId) {
        // Użytkownik NIEZALOGOWANY
        sidebar.style.display = 'none';
        renderLandingPage();
    } else {
        // Użytkownik ZALOGOWANY
        sidebar.style.display = 'flex'; // Aktywujemy sidebar
        window.navigate('workout');     // Odpalamy domyślną zakładkę
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