# Maze Solving Visualizer

## Overview

The **Maze Solving Visualizer** is a Python application built with Pygame that visually demonstrates how different pathfinding algorithms behave when solving a maze.

It generates a highly complex, imperfect maze (a "braid" maze containing multiple possible paths to the exit) using Randomized Prim's algorithm. You can then watch six distinct algorithms race simultaneously to see which one finds the exit fastest and which discovers the absolute shortest route.

The visualizer includes the following algorithms:

- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- A* Search (Manhattan Distance Heuristic)
- Dijkstra's Algorithm
- Greedy Best-First Search
- Uniform Cost Search

## Features

- **Fullscreen UI**: Immersive Pygame experience with real-time grid updates.
- **Interactive Controls**: Click on individual maze grids to start or pause them independently, or use the global Start/Stop buttons.
- **Live Leaderboard**: Tracks execution speed dynamically and explicitly highlights the algorithm that found the shortest route.

## Prerequisites

- Python 3.6+

## Installation

1. Clone this repository to your local machine.
2. Open your terminal or command prompt in the project directory.
3. Install the required dependencies (Pygame) by running:

   ```bash
   pip install -r requirements.txt
   ```

## Usage

To start the visualizer, run the following command from the root of the project directory:

```bash
python src/main.py
```

### Controls

- **Click a Maze**: Start or pause that specific algorithm.
- **Start All / Stop All**: Control all algorithms simultaneously.
- **New Maze**: Generates a completely new randomized labyrinth.
- **ESC**: Exit the application.
