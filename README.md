# 🦁 BheedChaal (Bagh-Chal)

A modern, full-stack web implementation of **BheedChaal** — Nepal's traditional asymmetric board game. Features real-time multiplayer via WebSockets, vs-AI gameplay, local pass-and-play, and custom board rendering using React and Django Channels.

Live App: [bagh-chal-2neu-two.vercel.app](https://bagh-chal-2neu-two.vercel.app)

---

## 🎮 Game Modes & Features

- **Local Pass & Play**: Play against a friend on the same device.
- **Vs AI Bot**: Test your skills against an automated bot opponent.
- **Online PvP**: Real-time matchmaking and live state sync over WebSockets.
- **Offline Mode**: Supported for offline play.
- **Interactive Board Engine**: Precise node graph layout rendering 25 intersections with accurate movement validation.

---

## 📜 Official BheedChaal Rules

### **Board Graph**
- **25 Nodes** arranged in a $5 \times 5$ grid.
- Diagonal lines connect only nodes where $(\text{row} + \text{col})$ is **EVEN**.

### **1. Placement Phase**
- **4 Lions** start pre-placed on the four outer corner nodes.
- **Sheep** places 1 sheep per turn from the reserve (20 total).
- **Lions** can move 1 step OR jump-capture sheep during the placement phase.
- **Sheep** cannot slide or move across the board until all 20 sheep have been placed from reserve.
- 
### **2. Movement Phase**
- Once all 20 sheep are placed, Sheep can move 1 step along connected lines to adjacent empty nodes.
- Lions continue moving 1 step or jumping to capture.
- 
### **3. Captures**
- A Lion captures a Sheep by jumping over an adjacent Sheep along a connected graph line into an empty node immediately behind it.

### **4. Winning Conditions**
- **Lions Win**: Capture 5 sheep.
- **Sheep Win**: Surround and trap all 4 Lions so they have 0 valid legal moves or jumps.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS
- **Backend**: Django REST Framework, Django Channels
- **In-Memory Broker**: Redis (Key Value Store)
- **Database**: PostgreSQL
- **Hosting**: Vercel (Frontend) & Render (Backend & Databases)

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


