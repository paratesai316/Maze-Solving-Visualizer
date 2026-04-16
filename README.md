# PathViz — AI Pathfinding Visualizer

## Overview

**PathViz** is a full-stack web application that visually demonstrates how different AI pathfinding algorithms work — both in abstract maze environments and on real-world maps.

The app features two modes:

1. **Maze Solver** — Watch 6 algorithms race through a procedurally generated maze simultaneously, with a live leaderboard tracking the fastest and shortest path.
2. **Real-World Navigation** — Click any two points on an interactive OpenStreetMap and find the driving route between them, demonstrating how the same graph-search algorithms power real navigation systems.

## Algorithms

| Algorithm | Optimal? | Strategy |
|---|---|---|
| Breadth-First Search (BFS) | ✅ | Explores all neighbors level by level |
| Depth-First Search (DFS) | ❌ | Dives deep before backtracking |
| A* Search | ✅ | Uses Manhattan distance heuristic + cost |
| Dijkstra's Algorithm | ✅ | Expands lowest cumulative cost node |
| Greedy Best-First Search | ❌ | Expands node closest to goal (heuristic only) |
| Uniform Cost Search (UCS) | ✅ | Expands lowest path-cost node |

## Features

### Maze Solver Tab
- **6 simultaneous algorithm visualizations** on crisp HTML5 Canvas grids
- **Focus Mode** — Click any algorithm card to expand it full-screen with dedicated Play / Pause / Reset controls and live stats (visited cells, path length, execution time)
- **Live Leaderboard** — Ranks algorithms by speed with ⚡ Fastest and ★ Shortest badges
- **Speed Slider** — Control animation speed in real-time
- **Instant Maze Generation** — Generate new mazes with one click

### Real-World Navigation Tab
- **Interactive OpenStreetMap** powered by Leaflet.js
- **Click-to-place** start (blue) and destination (pink) markers
- **Draggable markers** — Reposition points after placing them
- **Route computation** via OSRM (Open Source Routing Machine)
- **Route Details panel** — Shows distance (km), estimated time, and selected algorithm
- **Algorithm selector** — Choose which pathfinding algorithm conceptually powers the route
- **Clear & retry** — Reset markers and try different locations

## Prerequisites

- Python 3.6+

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/Maze-Solving-Visualizer.git
   cd Maze-Solving-Visualizer
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

Start the Flask server:

```bash
python src/app.py
```

Open your browser and go to: **[http://127.0.0.1:5000/](http://127.0.0.1:5000/)**

### Controls — Maze Solver

| Control | Action |
|---|---|
| **Play All** | Start all 6 algorithms simultaneously |
| **Pause** | Pause all running algorithms |
| **New Maze** | Generate a fresh maze and reset |
| **Speed Slider** | Adjust animation steps per frame |
| **Click a card** | Enter Focus Mode for that algorithm |
| **Back to all** | Exit Focus Mode and return to the grid |

### Controls — Real-World Navigation

| Control | Action |
|---|---|
| **Click map** | Place start point (1st click) then destination (2nd click) |
| **Drag markers** | Reposition start/end after placement |
| **Algorithm dropdown** | Select which algorithm to use |
| **Find Route** | Compute and display the driving route |
| **Clear** | Remove markers, route, and results |

## Tech Stack

- **Backend**: Python, Flask
- **Frontend**: HTML5 Canvas, Vanilla CSS, Vanilla JS
- **Maze Generation**: Randomized Prim's Algorithm
- **Mapping**: Leaflet.js + OpenStreetMap
- **Routing**: OSRM (Open Source Routing Machine)
- **Typography**: DM Sans, JetBrains Mono
