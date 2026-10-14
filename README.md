# 📦 Rentory — Inventory & Rental Dispatch Management System

> *"Everything in its place, everywhere you go."*

Rentory is a modern, full-stack inventory and equipment rental dispatch management solution tailored for audio/visual (AV), stage lighting, event production, and equipment rental businesses. Designed to track real-time gear availability, upcoming returns, client dispatch deadlines, and warehouse stock balance across mobile and web interfaces.

---

## 🌟 Key Features

### 🖥️ Web Dashboard & Inventory Catalog (`apps/web`)
- **Executive Dashboard**: Real-time snapshot of warehouse status:
  - **Metrics Overview**: Instant counts of Total Items, Available Stock, and Rented Equipment.
  - **Upcoming Returns**: Priority alerts with client names, due times, and rented gear lists (e.g. *Sharma Wedding &bull; 4 Speakers &bull; Due 6:00 PM today*).
  - **Quick Inventory Balance**: Visual progress meters showing availability vs. capacity for high-demand equipment.
- **Equipment Inventory Explorer**:
  - Category filtering tabs (**All**, **Audio**, **Lighting**, FX/Stage).
  - Real-time search by equipment name and model.
  - Visual asset representations (Speakers, Microphones, Stage Lights, Fog Machines) paired with stock availability bars.
  - Interactive tabbed mobile-first design system with smooth transitions and Phosphor icons.

### 📱 Mobile Application (`apps/mobile`)
- **React Native & Expo**: Cross-platform mobile app targeting Android, iOS, and Web.
- **Terminal Authentication**:
  - Branded **Welcome Screen** with visual overlay.
  - **Terminal-Based Login / Sign-up** supporting warehouse dispatch stations (e.g., `Terminal 07`), work email authentication (`@rentory.supply`), and toggleable remember-me states.
- **Live Dashboard**:
  - Personalized operator greetings and daily date synchronization.
  - Dynamic stock availability progress indicators with simulated latency hooks (`useDashboardData`).
  - Floating action button (FAB) for fast rental creation on the warehouse floor.

### ⚙️ Backend API & Infrastructure (`apps/api` & `infrastructure`)
- **FastAPI Backend (Planned/Scaffolded)**: Domain-driven design structure (`core`, `domains`, `workers`, `shared`).
- **Database Migrations**: Alembic configuration for automated schema evolution.
- **Docker Compose**: Containerized setup for local development with PostgreSQL and Redis.

---

## 📁 Repository Architecture

This project is organized as a monorepo:

```plaintext
Nirvan_InventoryManagementSystem_kalvium-community/
├── apps/
│   ├── mobile/                  # React Native mobile app (Expo SDK 51, TypeScript)
│   │   ├── src/
│   │   │   ├── assets/          # Background images and brand assets
│   │   │   ├── features/
│   │   │   │   ├── auth/        # WelcomeScreen & LoginScreen
│   │   │   │   └── dashboard/   # DashboardScreen & KPI widgets
│   │   │   └── store/           # Mock data hooks and inventory interfaces
│   │   ├── App.tsx              # App entrypoint and state-driven navigation
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                     # Interactive Web UI & Dashboard
│   │   ├── index.html           # Semantic multi-page HTML5 layout
│   │   ├── style.css            # Custom CSS3 design system & glassmorphism
│   │   ├── script.js            # Tab switching & filter interaction logic
│   │   ├── *.png                # Equipment renders (speaker, mic, lights, fog)
│   │   └── package.json
│   │
│   └── api/                     # Backend API service (Python / FastAPI)
│       ├── src/
│       │   ├── core/            # Config, security, database engines
│       │   ├── domains/         # Domain business logic (inventory, rentals)
│       │   ├── migrations/      # Alembic database migrations
│       │   ├── workers/         # Background tasks and workers
│       │   └── main.py          # FastAPI application entrypoint
│       ├── alembic.ini          # Migration tool configuration
│       └── pyproject.toml
│
├── infrastructure/
│   └── docker/
│       └── docker-compose.yml   # Multi-container orchestration (DB, Cache)
│
├── pnpm-workspace.yaml          # Monorepo workspace configuration
├── package.json                 # Root workspace configuration
└── README.md                    # Project documentation
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Mobile App** | React Native (0.74.5), Expo SDK 51, TypeScript, React 18 |
| **Web Frontend** | HTML5, Modern CSS3 (Variables, Flexbox/Grid), JavaScript (ES6+), Phosphor Icons |
| **Backend API** | Python 3.10+, FastAPI, SQLAlchemy, Alembic, Pydantic |
| **Infrastructure** | Docker, Docker Compose, PostgreSQL, Redis |
| **Monorepo Tools** | pnpm workspaces |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/) or `npm`
- [Python](https://www.python.org/) 3.10+ (for API development)
- [Expo Go](https://expo.dev/go) app on your mobile device or an Android/iOS emulator

---

### 1. Running the Mobile App (`apps/mobile`)

```bash
# Navigate to the mobile app directory
cd apps/mobile

# Install dependencies
npm install

# Start the Expo development server
npm run start
```

From the Expo CLI interface:
- Press `a` to open in an **Android Emulator** or device.
- Press `i` to open in an **iOS Simulator**.
- Press `w` to run in a **Web Browser**.
- Scan the generated QR code using the **Expo Go** app on your physical phone.

---

### 2. Running the Web App (`apps/web`)

The web application is standalone and can be served directly using any local HTTP server:

```bash
# Option A: Using Python's built-in HTTP server
cd apps/web
python -m http.server 3000

# Option B: Using npx serve
npx serve apps/web
```

Open your browser and navigate to `http://localhost:3000`.

---

### 3. Backend Setup & Infrastructure (`apps/api`)

```bash
# Launch database and cache services
docker compose -f infrastructure/docker/docker-compose.yml up -d

# Navigate to the API directory
cd apps/api

# Create and activate a Python virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies & run migrations (once configured)
pip install -e .
alembic upgrade head
```

---

## 📋 Roadmap & Next Milestones

- [x] Initial project monorepo structure setup (`api`, `mobile`, `web`, `infrastructure`).
- [x] Mobile authentication & onboarding screens (Welcome, Login / Sign Up).
- [x] Dynamic mobile inventory dashboard with KPI summaries.
- [x] Interactive web dashboard & equipment catalog with search and category filtering.
- [ ] Connect mobile and web apps to live FastAPI backend endpoints.
- [ ] QR / Barcode scanning for instant gear check-in and check-out.
- [ ] Rental booking calendar, customer management, and dispatch invoice generation.

---

## 👥 Authors & Community

- Built as part of the **Kalvium Community** project initiative.
- Maintained by [Nirvan Jain](https://github.com/kalviumcommunity/Nirvan_InventoryManagementSystem_kalvium-community).
