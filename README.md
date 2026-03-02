# 💪 Gym Tracker

A self-hosted Progressive Web App for tracking gym workouts, built for personal use and deployed on my own Ubuntu server.

The app lets multiple users log in with PIN authentication, create custom workout plans from a library of 50+ exercises, track sets/reps/weight in real time, and automatically suggests progression targets based on previous performance.

## Screenshots

> _Coming soon_

## Tech Stack

**Backend**
- Go (Gin framework)
- MariaDB 10.11
- bcrypt password hashing
- HMAC-based token authentication

**Frontend**
- Vanilla JavaScript (ES Modules)
- Responsive CSS (mobile-first, iOS-style UI)
- PWA with offline manifest

**Infrastructure**
- Docker with multi-stage builds
- Docker Compose for orchestration
- Nginx (Alpine) as frontend server
- Self-hosted on Ubuntu Server

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌────────────┐
│   Nginx     │────▶│   Go Backend     │────▶│  MariaDB   │
│  :5000      │     │   :5001 (4000)   │     │  :3306     │
│  Frontend   │     │   REST API       │     │            │
└─────────────┘     └──────────────────┘     └────────────┘
```

All services run as Docker containers managed by Docker Compose.

## Features

- **Multi-user** — PIN-based login, each user has their own plans and history
- **Workout plans** — Create custom plans, pick exercises by category, set target sets
- **Live tracking** — Log reps and weight per set during your session
- **Auto-progression** — If you hit 10+ reps, the app suggests +2.5kg for next session
- **Admin panel** — Separate admin console for user management and PIN resets
- **Health endpoint** — `GET /health` for monitoring
- **Security** — bcrypt-hashed PINs, HMAC auth tokens, protected API routes, admin-only middleware

## Getting Started

### Prerequisites

- Docker & Docker Compose

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Gym-Tracker.git
   cd Gym-Tracker
   ```

2. Create a `.env` file in the project root:
   ```env
   MYSQL_DATABASE=gym_tracker
   MYSQL_ROOT_PASSWORD=your_root_password
   MYSQL_USER=gym_user
   MYSQL_PASSWORD=your_db_password
   DB_DSN=gym_user:your_db_password@tcp(db:3306)/gym_tracker?parseTime=true
   AUTH_SECRET=your-random-secret-here
   CORS_ORIGIN=*
   ```

3. Build and run:
   ```bash
   docker compose up -d --build
   ```

4. Open `http://your-server-ip:5000` in a browser.

### Default Ports

| Service  | Port |
|----------|------|
| Frontend | 5000 |
| Backend  | 5001 |
| MariaDB  | 3306 (internal) |

## Project Structure

```
├── backend/
│   ├── auth.go           # HMAC token generation & auth middleware
│   ├── database.go       # DB connection, migrations, seed data
│   ├── handlers.go       # All REST API handlers
│   ├── main.go           # Router setup & middleware
│   ├── exercises.json    # Exercise library (50+ exercises)
│   └── go.mod
├── frontend/
│   ├── css/style.css
│   ├── js/
│   │   ├── api.js        # API client
│   │   ├── app.js        # Entry point & routing
│   │   ├── auth.js       # Login/signup UI
│   │   ├── dashboard.js  # Plan list & settings
│   │   ├── editor.js     # Workout plan creator
│   │   ├── workout.js    # Live workout tracking
│   │   ├── admin.js      # Admin console
│   │   └── state.js      # Global state & auth helper
│   ├── admin.html
│   ├── index.html
│   ├── manifest.json
│   └── nginx.conf
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── .env                  # Not committed (in .gitignore)
```

## Roadmap

- [ ] **Workout history view** — Calendar/log of past sessions with stats
- [ ] **Progress charts** — Visualize strength gains over time per exercise
- [ ] **Kubernetes deployment** — Migrate from Docker Compose to K8s manifests (Deployments, Services, Ingress, PersistentVolumeClaims) for better scaling and self-healing
- [ ] **Helm chart** — Package the entire stack as a reusable Helm chart
- [ ] **CI/CD pipeline** — Automated builds and deploys on push
- [ ] **Export/backup** — Export workout data to CSV/JSON
- [ ] **Rest timer** — Built-in countdown timer between sets
- [ ] **Dark mode** — Theme toggle

## License

This is a personal project. Feel free to use it as reference or inspiration.
