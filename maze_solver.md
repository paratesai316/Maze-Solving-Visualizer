# Maze Solving & Real-World Navigation: System Architecture and Logic Breakdown

This document provides a comprehensive explanation of how the PathViz application operates, detailing the step-by-step logic and the underlying algorithms for both the classic grid-based Maze Solver and the Map-based Real-World Pathfinding environments.

---

## Part 1: The Maze Solver (Abstract Grid)

The Maze Solver is an interactive sandbox visualizing how artificial intelligence algorithms explore abstract top-down environments.

### 1. Maze Generation & Interactivity

- **Grid Layout**: The frontend dynamically generates a DOM-based grid of HTML cells. Each cell has an identifier representing its (x, y) coordinates.
- **Node States**: Nodes can exist in different states: `start`, `end`, `wall` (obstacle), `empty`, `visited` (during search animation), and `path` (the final route).
- **Random Obstacles**: The user can click "Generate Walls" which iterates over the available empty cells and randomly assigns a subset to be `wall` cells, ensuring the start and end nodes are never obstructed.
- **Custom Painting**: Through mouse click-and-drag event listeners, users can manually draw walls and erase them to build custom topological problems for the AI to solve.

### 2. Payload and Backend Communication

When the user selects an algorithm and clicks "Solve", the frontend serializes the state of the grid. It creates a matrix where:

- `0` represents open paths
- `1` represents walls
- `S` represents the start
- `E` represents the end
This serialized grid is sent via a `POST` request to the Flask backend's `/solve` endpoint.

### 3. Grid Pathfinding Algorithms

The backend translates the incoming grid into an unweighted graph where the adjacent empty cells (up, down, left, right) serve as valid neighbor edges.

Six pathfinding algorithms are implemented to navigate this grid:

1. **Breadth-First Search (BFS)**: Uses a standard FIFO Queue. It expands like a ripple in water. guarantees the absolute shortest path on an unweighted grid by exploring equally in all directions.
2. **Depth-First Search (DFS)**: Uses a LIFO Stack. It dives down a single branch blindly until it hits a dead-end, then backtracks. It rarely finds the shortest path, but demonstrates an aggressive search pattern.
3. **Dijkstra's Algorithm**: Uses a Priority Queue (Min-Heap). While essentially identical to BFS on an unweighted grid, it is designed to strictly prioritize nodes with the lowest accumulated cost from start.
4. **A* Search (A-Star)**: Uses a Priority Queue. It optimizes Dijkstra by introducing a heuristic (the physical Manhattan or Euclidean distance remaining to the target). It prioritizes cells that are strictly moving closer to the target, avoiding expanding cells aggressively in the wrong direction.
5. **Greedy Best-First Search**: Also uses a Priority Queue. Unlike A*, it only cares about the heuristic (distance to goal). This makes it aggressively fast but frequently causes it to get trapped navigating around large concave walls, leading to suboptimal paths.
6. **Uniform Cost Search (UCS)**: Algorithmically synonymous with Dijkstra on this unweighted grid.

During execution, each algorithm records *every single cell* it views into a `visited_cells` list, and subsequently tracks the final winning chain in a `path_coords` list. These are returned to the frontend where an animation frame loop slowly "paints" them to visually demonstrate *how* the AI thought.

---

## Part 2: Real-World Navigation

The map tab applies those exact abstract pathfinding concepts to actual geographical cities and street architecture using an interactive Leaflet.js map.

### 1. Map Interaction and Initialization

- Users click the map layout to place custom Start and Destination geographic coordinates (`lat`, `lng`).
- When "Find Route" is executed with an algorithm selected, a payload containing these real coordinate pairs is sent to the `/map_solve` Python endpoint.

### 2. Defining Bounding Regions & Caching

Because downloading the map of the entire planet is impossible, the server must calculate a strict regional "Bounding Box".

- **Dynamic Bounding**: It calculates the mathematical middle of the two user-selected markers to build a tight rectangular zone. It applies a 10% padding (with a floor of 200m) to ensure intersection turns just outside the direct route can still be leveraged by the algorithm.
- **Clipping**: To prevent users from placing points across states and crashing the server downloading tens of thousands of roads, a hard cap ceiling (`MAX_SPAN`) algorithmically throttles the maximum allowed area to roughly ~5km.
- **LRU Caching**: Since interacting back-and-forth fetches the exact same city block, road fetches are wrapped in a `@functools.lru_cache`. The user's coordinates are quantized slightly (rounded off) which bins requests together — allowing identical region-bounds to load locally from memory instantly without HTTP network delays or OpenStreetMap rate limitations.

### 3. Fetching Roads and Constructing the Graph

- **The Overpass API**: The backend constructs an Overpass Query Language (OQL) payload parsing specifically for vehicle-navigable `<way>` tags (removing noise like trails or building polygons). It targets main fallback servers using specific HTTP `User-Agent` headers to guarantee reliable routing.
- **Node & Way Parsing**: The JSON API returns tens of thousands of geographical points representing intersection data (`Nodes`) connected explicitly by lines (`Ways`). 
- **Graph Generation**: The backend converts these shapes into a mathematically weighted Graph data structure. The adjacent nodes are mapped using the **Haversine Formula** (which dictates the precise distance measured in meters across a spherical globe between two latitudes/longitudes). This Haversine calculation becomes the absolute weighted "Cost" edge for traversing a specific street.

### 4. Running the Map Algorithms

The core mechanics form the exact algorithms from the Maze Solver, but this time they are navigating realistic, physical-distance weighted graphs.

- To execute, the backend must dynamically snap the user's arbitrary starting lat/lng pin drop to the physically nearest legitimate road Node in the dataset using brute-force distance comparisons.
- The pathfinding algorithm navigates the interconnected streets. Because roads are different physical lengths, Algorithms like A* and Dijkstra shine here, explicitly prioritizing "shortest meter distance" edges dynamically weighted by Haversine integers.
- Similar to the grid, every physical road segment that is considered by the algorithm is cached into a `visited_edges` array, and the successful shortest routing sequence is stored in `path_coords`.

### 5. Frontend Animation Overlays

The Flask backend returns all three elements: `[The Entire Road Network]`, `[Explored Visited Edges]`, & `[Final Geometric Path]`.

- First, the frontend overlays light grey GeoJSON lines across the map showing the explicit graph the AI reasoned against.
- Second, an animation loop meticulously highlights each physical street segment the algorithm visited dynamically in yellow.
- Finally, the winning Haversine-optimized sequence draws the active green navigation path between the start location and destination, while rendering statistics on distance explored.
