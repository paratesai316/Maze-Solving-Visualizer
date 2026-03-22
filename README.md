# Maze Solving Visualizer (Web Edition)

## Overview

The **Maze Solving Visualizer** is a high-performance, full-stack web application that visually demonstrates how different Artificial Intelligence pathfinding algorithms behave when navigating a complex labyrinth.

It generates a highly intricate, imperfect maze (a "braid" maze containing multiple possible paths to the exit) in Python using Randomized Prim's algorithm. A Flask backend server instantly evaluates all of the algorithms in memory and beautifully streams their coordinates to a sleek, modern HTML/JS frontend. You can watch six distinct algorithms race simultaneously natively in your browser flawlessly at 60 FPS to see which one finds the exit fastest and which one discovers the absolute shortest route!

The visualizer computes the following 6 algorithms simultaneously:

- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- A* Search (Manhattan Distance Heuristic)
- Dijkstra's Algorithm
- Greedy Best-First Search
- Uniform Cost Search (UCS)

## Features

- Modern Web Interface
- Hardware-Accelerated Canvas Grids
- Interactive Capabilities
- Live Leaderboard

## Prerequisites

- Python 3.6+

## Installation

1. Clone this repository to your local machine.
2. Open your terminal or command prompt in the project directory.
3. Install the required backend dependencies (Flask) by running:

   ```bash
   pip install -r requirements.txt
   ```

## Usage

To start the visualizer, run the following command from the root of the project directory to launch the Flask REST server:

```bash
python src/app.py
```

Then, open your preferred web browser and navigate directly to:
**[http://127.0.0.1:5000/](http://127.0.0.1:5000/)**

### Controls

- **Animation Speed Slider**: Modifies how many steps of the algorithm iterate per frame (allowing you to visually speed up or slow down the algorithms natively in real-time).
- **Resume / Play All**: Commences the simultaneous race.
- **Pause All**: Halts the animation mid-search.
- **Generate New Maze**: Instructs the Python backend to synthesize a completely new maze dimension and recalculates all routing paths.
- **Click a Maze Grid**: Optionally, you can click on any individual maze grid to seamlessly pause or resume that specific algorithm independently!
