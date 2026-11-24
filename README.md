# 🎮 Modern Tic-Tac-Toe Game (JavaScript)

A sleek, responsive, and feature-rich Tic-Tac-Toe game built with modern Vanilla JavaScript, CSS3, and HTML5.

---

## ✨ Features

- 🤖 **Single Player (Vs Computer AI)**:
  - **Easy**: Random casual moves.
  - **Medium**: Blocks immediate opponent wins and capitalizes on winning lines.
  - **Unbeatable (Hard)**: Powered by the **Minimax Algorithm with Alpha-Beta Pruning** — mathematically impossible to beat!
- 👥 **2-Player Mode**: Local turn-based pass-and-play.
- 🎨 **Modern Dark Aesthetic**: Glassmorphism cards, glowing neon accents, smooth pop-in animations, and responsive mobile-first grid.
- 🔊 **Built-in Sound Effects**: Zero external audio files required! Synthesized real-time using the **Web Audio API** with a quick mute toggle.
- 🎊 **Confetti Celebration**: Pure Canvas particle explosion on victory.
- ⚡ **Winning Line Strike-through**: Dynamic SVG line automatically strikes through winning rows, columns, or diagonals.
- 📊 **Live Scoreboard**: Tracks Player X wins, Player O / AI wins, and Draws.
- 🎯 **Ghost Marker Hover**: Subtle hover preview shows where your mark will land.

---

## 🚀 How to Run

### Option 1: Direct in Browser (Simplest)
Just double-click `index.html` or drag it into any web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Using the Built-in Node.js Server
If you have Node.js installed, open your terminal in this directory and run:

```bash
node server.js
```
Then visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 File Structure

```
tic-tac-toe/
├── index.html       # Markup structure and semantic layout
├── style.css        # Responsive styling, animations & glowing effects
├── script.js        # Minimax AI, audio synth, confetti & game logic
├── server.js        # Optional zero-dependency local static server
└── README.md        # Documentation
```
