# PathViz — AI Pathfinding Visualizer

## Overview

**PathViz** is a full-stack web application that visually demonstrates how different AI pathfinding algorithms work — both in abstract maze environments and on real-world maps.

The app features two modes:

1. **Maze Solver** — Watch 6 algorithms race through a procedurally generated maze simultaneously, with a live leaderboard tracking the fastest and shortest path.
2. **Real-World Navigation** — Click any two points on an interactive OpenStreetMap to visualize real-time pathfinding on actual street networks. It dynamically fetches real OpenStreetMap road data via the Overpass API to demonstrate how the same graph-search algorithms power real-world navigation systems.

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

### Real-World Navigation Tab (New Updates)
- **Dynamic OSM Routing Engine**: Replaced basic routing with a custom robust graph-based pathfinding engine.
- **Overpass API Integration**: Fetches real road data dynamically within a bounded box and constructs a weighted adjacency-list graph directly in memory.
- **Multiple Supported Algorithms**: Visualize real-world pathfinding using custom Python implementations of BFS, DFS, Dijkstra, A*, Greedy Best-First, and UCS over actual street configurations.
- **Interactive Map**: Powered by Leaflet.js with click-to-place start (blue) and destination (pink) markers. 
- **Draggable Markers**: Reposition points after placing them, automatically snapping to the nearest valid road nodes.
- **Detailed Analytics Panel**: View detailed execution stats including path distance (km), execution time, total visited edges during the search, and total road network nodes dynamically.

## Prerequisites

- Python 3.6+
- Active internet connection (for Overpass API and Leaflet Maps visualization)

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/Maze-Solving-Visualizer.git
   cd Maze-Solving-Visualizer
   ```

2. Create a virtual environment (Optional but Recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   **Dependencies overview:**
   - `Flask` (Backend Web Framework)
   - `requests` (Fetching Overpass API data for map navigation)
   - `pygame` (Internal dependency)

## Usage

Start the Flask server:

```bash
python src/app.py
```

Open your browser and navigate to: **[http://127.0.0.1:5000/](http://127.0.0.1:5000/)**

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
| **Algorithm dropdown** | Select which algorithm (A*, BFS, DFS, etc.) to use |
| **Find Route** | Computes paths by pulling live OSM data, building graphs, and executing the chosen algorithm |
| **Clear** | Remove markers, route layer, and results |

## Tech Stack

- **Backend**: Python, Flask, Custom Graph Pathfinding Engine
- **Frontend**: HTML5 Canvas, Vanilla CSS, Vanilla JS
- **API Integrations**: Overpass API for real-time map/graph road data
- **Mapping**: Leaflet.js + OpenStreetMap tiles
- **Maze Generation**: Randomized Prim's Algorithm
- **Typography**: DM Sans, JetBrains Mono
