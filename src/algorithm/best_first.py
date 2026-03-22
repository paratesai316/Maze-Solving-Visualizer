import heapq
from .utils import get_neighbors, reconstruct_path

def solve(maze, start, end):
    def heuristic(a, b):
        return abs(a[0] - b[0]) + abs(a[1] - b[1])
        
    open_set = []
    heapq.heappush(open_set, (heuristic(start, end), start))
    came_from = {}
    visited = set()
    enqueued = {start}
    
    while open_set:
        _, current = heapq.heappop(open_set)
        
        if current in visited:
            continue
        visited.add(current)
        
        if current == end:
            yield current, visited, reconstruct_path(came_from, current)
            return
            
        yield current, visited, None
        
        for neighbor in get_neighbors(maze, current):
            if neighbor not in visited and neighbor not in enqueued:
                enqueued.add(neighbor)
                came_from[neighbor] = current
                heapq.heappush(open_set, (heuristic(neighbor, end), neighbor))
                
    yield None, visited, []
