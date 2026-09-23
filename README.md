# 🦁 BheedChaal (Bagh-Chal)

A modern, full-stack web implementation of **BheedChaal** — Nepal's traditional asymmetric board game[span_1](start_span)[span_1](end_span). Features real-time multiplayer via WebSockets, vs-AI gameplay, local pass-and-play, and custom board rendering using React and Django Channels[span_2](start_span)[span_2](end_span).

Live App: [bagh-chal-2neu-two.vercel.app](https://bagh-chal-2neu-two.vercel.app)[span_3](start_span)[span_3](end_span)

---

## 🎮 Game Modes & Features

- **Local Pass & Play**: Play against a friend on the same device[span_4](start_span)[span_4](end_span).
- **Vs AI Bot**: Test your skills against an automated bot opponent[span_5](start_span)[span_5](end_span).
- **Online PvP**: Real-time matchmaking and live state sync over WebSockets[span_6](start_span)[span_6](end_span).
- **Offline Mode**: Supported for offline play[span_7](start_span)[span_7](end_span).
- **Interactive Board Engine**: Precise node graph layout rendering 25 intersections with accurate movement validation[span_8](start_span)[span_8](end_span).

---

## 📜 Official BheedChaal Rules

### **Board Graph**
- **25 Nodes** arranged in a $5 \times 5$ grid[span_9](start_span)[span_9](end_span).
- Diagonal lines connect only nodes where $(\text{row} + \text{col})$ is **EVEN**[span_10](start_span)[span_10](end_span).

### **1. Placement Phase**
- **4 Lions** start pre-placed on the four outer corner nodes[span_11](start_span)[span_11](end_span).
- **Sheep** places 1 sheep per turn from the reserve (20 total)[span_12](start_span)[span_12](end_span).
- **Lions** can move 1 step OR jump-capture sheep during the placement phase[span_13](start_span)[span_13](end_span).
- **Sheep** cannot slide or move across the board until all 20 sheep have been placed from reserve[span_14](start_span)[span_14](end_span).

### **2. Movement Phase**
- Once all 20 sheep are placed, Sheep can move 1 step along connected lines to adjacent empty nodes[span_15](start_span)[span_15](end_span).
- Lions continue moving 1 step or jumping to capture[span_16](start_span)[span_16](end_span).

### **3. Captures**
- A Lion captures a Sheep by jumping over an adjacent Sheep along a connected graph line into an empty node immediately behind it[span_17](start_span)[span_17](end_span).

### **4. Winning Conditions**
- **Lions Win**: Capture 5 sheep[span_18](start_span)[span_18](end_span).
- **Sheep Win**: Surround and trap all 4 Lions so they have 0 valid legal moves or jumps[span_19](start_span)[span_19](end_span).

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS[span_20](start_span)[span_20](end_span)
- **Backend**: Django REST Framework, Django Channels[span_21](start_span)[span_21](end_span)
- **In-Memory Broker**: Redis (Key Value Store)[span_22](start_span)[span_22](end_span)
- **Database**: PostgreSQL[span_23](start_span)[span_23](end_span)
- **Hosting**: Vercel (Frontend) & Render (Backend & Databases)[span_24](start_span)[span_24](end_span)

---

## ⚡ Quick Start (Local Setup)

### **Backend (Django + Channels)**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
daphne -b 127.0.0.1 -p 8000 core.asgi:application


