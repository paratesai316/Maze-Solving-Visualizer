from flask import Flask, jsonify, render_template, request
import time
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from algorithm.bfs import solve as bfs_solve
from algorithm.dfs import solve as dfs_solve
from algorithm.a_star import solve as a_star_solve
from algorithm.dijkstra import solve as dijkstra_solve
from algorithm.best_first import solve as best_first_solve
from algorithm.uniform_cost import solve as ucs_solve

from maze.generator import generate_maze

app = Flask(__name__)

MAZE_COLS = 61
MAZE_ROWS = 61

def get_algorithm_data(name, generator_func, maze, start, end):
    visited_seq = []
    final_path = []
    
    start_time = time.perf_counter()
    
    for current, _, path in generator_func(maze, start, end):
        if current is not None:
            visited_seq.append(current)
        if path is not None and len(path) > 0:
            final_path = path
            break
            
    exec_time = time.perf_counter() - start_time
    
    return {
        "name": name,
        "visited_sequence": visited_seq,
        "path": final_path,
        "time": exec_time
    }

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate", methods=["GET"])
def generate():
    maze = generate_maze(MAZE_COLS, MAZE_ROWS)
    start = (1, 1)
    end = (MAZE_COLS - 2, MAZE_ROWS - 2)
    return jsonify({
        "maze": maze,
        "start": start,
        "end": end,
        "cols": MAZE_COLS,
        "rows": MAZE_ROWS
    })

@app.route("/solve", methods=["POST"])
def solve():
    data = request.json
    maze = data["maze"]
    start = tuple(data["start"])
    end = tuple(data["end"])
    
    results = [
        get_algorithm_data("Breadth-First Search", bfs_solve, maze, start, end),
        get_algorithm_data("Depth-First Search", dfs_solve, maze, start, end),
        get_algorithm_data("A* Search", a_star_solve, maze, start, end),
        get_algorithm_data("Dijkstra's Algorithm", dijkstra_solve, maze, start, end),
        get_algorithm_data("Greedy Best-First Search", best_first_solve, maze, start, end),
        get_algorithm_data("Uniform Cost Search", ucs_solve, maze, start, end)
    ]
    
    return jsonify(results)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
