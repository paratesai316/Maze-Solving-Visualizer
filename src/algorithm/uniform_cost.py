import heapq
from .utils import get_neighbors, reconstruct_path

def solve(maze, start, end):
    open_set = []
    heapq.heappush(open_set, (0, start))
    came_from = {}
    
    cost_so_far = {start: 0}
    visited = set()
    
    while open_set:
        current_cost, current = heapq.heappop(open_set)
        
        if current in visited:
            continue
        visited.add(current)
        
        if current == end:
            yield current, visited, reconstruct_path(came_from, current)
            return
            
        yield current, visited, None
        
        for neighbor in get_neighbors(maze, current):
            new_cost = cost_so_far[current] + 1
            
            if neighbor not in cost_so_far or new_cost < cost_so_far[neighbor]:
                cost_so_far[neighbor] = new_cost
                came_from[neighbor] = current
                heapq.heappush(open_set, (new_cost, neighbor))
                
    yield None, visited, []