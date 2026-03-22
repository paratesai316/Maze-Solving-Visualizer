import heapq
from .utils import get_neighbors, reconstruct_path

def solve(maze, start, end):
    def heuristic(a, b):
        return abs(a[0] - b[0]) + abs(a[1] - b[1])
        
    open_set = []
    heapq.heappush(open_set, (heuristic(start, end), start))
    came_from = {}
    
    g_score = {start: 0}
    visited = set()
    
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
            tentative_g_score = g_score.get(current, float('inf')) + 1
            
            if tentative_g_score < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g_score
                f_score = tentative_g_score + heuristic(neighbor, end)
                heapq.heappush(open_set, (f_score, neighbor))
                
    yield None, visited, []
