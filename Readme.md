# 🐅 BheedChaal | BaghChal

> A modern, real-time digital implementation of Nepal's traditional strategy game **BaghChal (बाघचाल)**.

BheedChaal brings the classic Tiger-and-Goat strategy game to the web with a modern interactive board, Human vs AI gameplay, and real-time online multiplayer.

Built with **React, Django, Django REST Framework, Django Channels, PostgreSQL, Redis, and WebSockets**.

---

## 🎮 Game Modes

### 👥 Local | Human vs Human

Play Bagh-Chal with another person on the same device.

- No account required for local gameplay
- Real-time board interaction
- Full game rules
- Legal move validation
- Capture detection
- Win detection

### 🤖 Human vs AI

Play against an AI opponent with multiple difficulty levels.

**Difficulty levels:**

- 🟢 Easy
- 🟡 Medium
- 🔴 Hard

The AI uses Minimax-based decision making with Alpha-Beta pruning and game-state evaluation.

### 🌐 Online PvP

Play against another human player online.

- Authenticated players
- Room-based multiplayer
- Real-time WebSocket communication
- Server-authoritative game state
- Reconnection support
- Refresh recovery
- Concurrent move protection

---

## 🐅 What is BaghChal?

Bagh-Chal (बाघचाल), meaning **"Tiger's Move"**, is a traditional Nepalese strategy board game.

The game is played between:

- **4 Tigers**
- **20 Goats**

The Tigers attempt to capture goats, while the goats attempt to restrict and trap all four Tigers.

BheedChaal preserves the core strategic mechanics of the traditional game while providing a modern digital experience.

---

## ✨ Features

### 🎯 Core Gameplay

- 5×5 game board
- 25 board positions
- 4 Tigers
- 20 Goats
- Goat placement phase
- Movement phase
- Tiger movement
- Tiger capture mechanics
- Tiger trapping detection
- Victory detection
- Move history
- Game reset

### 🤖 AI

- Human vs AI
- Easy difficulty
- Medium difficulty
- Hard difficulty
- Minimax search
- Alpha-Beta pruning
- Mobility evaluation
- Positional evaluation
- Capture prioritization
- Non-blocking AI execution

### 🌐 Multiplayer

- Real-time online PvP
- WebSocket communication
- Room-based games
- Authenticated players
- Player-role enforcement
- Server-authoritative state
- Reconnection support
- Browser refresh recovery
- Concurrent move protection

### 🔐 Security

- JWT authentication
- Server-side move validation
- Server-authoritative game state
- Role enforcement
- Illegal move rejection
- State-version protection
- Replay/stale move protection
- Transactional database updates
- Room-level concurrency protection
- Sensitive information excluded from logs

### 🎨 User Experience

- Responsive board
- Mobile-friendly controls
- Touch-friendly interaction
- Animated game pieces
- Compact move suggestions
- Selected-piece highlighting
- Capture indicators
- AI thinking indicator
- Victory animations
- Built-in sound effects
- Sound toggle

---

# 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │      React / Vite    │
                         │      Frontend        │
                         └──────────┬───────────┘
                                    │
                         HTTPS / WebSocket
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Django / DRF       │
                         │   Django Channels    │
                         │   Daphne / ASGI      │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
          │ PostgreSQL   │  │    Redis     │  │  Game Engine │
          │              │  │              │  │              │
          │ Persistence  │  │ WebSockets   │  │ Rules + AI   │
          └──────────────┘  └──────────────┘  └──────────────┘
