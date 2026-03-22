import heapq
from .utils import get_neighbors, reconstruct_path

def solve(maze, start, end):
    open_set = []
    heapq.heappush(open_set, (0, start))
    came_from = {}
    
    g_score = {start: 0}
    visited = set()
    
    while open_set:
        dist, current = heapq.heappop(open_set)
        
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
                heapq.heappush(open_set, (tentative_g_score, neighbor))
                
    yield None, visited, []
