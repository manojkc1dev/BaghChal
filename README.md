# BheedChaal (Bagh-Chal Digital Board Game)

A real-time, production-ready, full-stack web implementation of **BheedChaal** (a variant of the traditional Nepalese strategy game Bagh-Chal) built with **React (Vite)**, **Django Channels**, **ASGI**, and **Redis**.

---

## 🏗️ Architecture Overview

```
bheedchaal_project/
├── frontend/                  # React Application (Vite, Tailwind CSS 4)
│   ├── src/
│   │   ├── components/        # Board, Node, Piece, Scoreboard, Controls
│   │   ├── context/           # GameStateContext (useReducer State Machine)
│   │   └── utils/             # Undirected Graph Engine & Math (gameLogic.js)
│   └── package.json
│
├── backend/                   # Django Application (ASGI & Channels)
│   ├── manage.py
│   ├── core/                  # Django Core Settings & ASGI Router
│   │   ├── settings.py        # Configured for ASGI, Channels & Redis
│   │   ├── asgi.py            # ProtocolTypeRouter (HTTP + WebSockets)
│   │   └── urls.py            
│   │
│   ├── accounts/              # DRF Authentication App
│   └── game_engine/           # Real-Time WebSocket Game App
│       ├── consumers.py       # AsyncWebsocketConsumer (Room Broadcasting)
│       ├── routing.py         # WebSocket URL Router (ws/game/<room>/)
│       └── logic.py           # Pure Python Game Rules Engine
│   └── requirements.txt       
│
└── docker-compose.yml         # Local Redis Container Setup
```

---

## 📐 Graph Representation & Game Rules

- **Board Graph**: 25 Nodes ($5 \times 5$ Grid, nodes 0 to 24).
- **Diagonal Rule**: Diagonal connections exist **only at nodes where `(row + col)` is EVEN**.
- **Center Node (Node 12)**: Degree 8 (4 orthogonal + 4 diagonal edges).
- **Pieces**: 4 Lions vs 20 Sheep.
- **Phases**:
  1. **Placement Phase**: Sheep places 1 sheep per turn. Lions move or capture.
  2. **Movement Phase**: Starts after placing all 20 sheep. Sheep can now move 1 step along graph edges.
- **Winning Conditions**:
  - **Lions Win**: Capture 5 sheep.
  - **Sheep Win**: Trap all 4 Lions with 0 valid moves or jumps.

---

## 🚀 Quick Start Guide

### 1. Run Redis Container
```bash
docker-compose up -d
```

### 2. Set Up & Run Django Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

### 3. Run React Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend Dev Server: `http://localhost:5173`
Backend WebSocket Endpoint: `ws://localhost:8000/ws/game/<room_name>/`
